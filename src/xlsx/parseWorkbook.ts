import ExcelJS from "exceljs";
import type { WorkbookModel, DataGroup, VariableDefinition, DataRow, DataValue } from "../types/appTypes";
import { defaultGroups } from "../config/defaultGroups";
import { defaultVariables } from "../config/defaultVariables";
import { workbookSheetNames } from "./workbookSchema";
import { validateFileType, validateDataSheet, validateGroupsSheet, validateVariablesSheet } from "./validateWorkbook";

export interface ParseResult {
  model: WorkbookModel | null;
  errors: string[];
}

type ParsedCellValue = string | number | boolean | Date | null;
type ParsedSheetRow = Record<string, ParsedCellValue>;

function cellToValue(value: ExcelJS.CellValue): ParsedCellValue {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    if ("result" in value) return cellToValue(value.result as ExcelJS.CellValue);
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map(part => part.text).join("");
    }
    if ("hyperlink" in value && "text" in value && typeof value.text === "string") return value.text;
  }
  return String(value);
}

function cellToHeader(value: ExcelJS.CellValue): string {
  const parsed = cellToValue(value);
  return parsed === null ? "" : String(parsed).trim();
}

function sheetToRows(sheet: ExcelJS.Worksheet): { headers: string[]; rows: ParsedSheetRow[] } {
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = cellToHeader(cell.value);
  });

  const rows: ParsedSheetRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const parsed: ParsedSheetRow = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellToValue(row.getCell(index + 1).value);
      parsed[header] = value;
      if (value !== null && value !== "") hasValue = true;
    });
    if (hasValue) rows.push(parsed);
  }

  return { headers: headers.filter(Boolean), rows };
}

export async function parseWorkbookFile(file: File): Promise<ParseResult> {
  const fileErr = validateFileType(file);
  if (fileErr) return { model: null, errors: [fileErr] };

  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf);
  } catch {
    return { model: null, errors: ["Failed to parse XLSX file."] };
  }

  const dataSheet = wb.getWorksheet(workbookSheetNames.data);
  if (!dataSheet) {
    return { model: null, errors: ["Workbook must contain a Data sheet."] };
  }

  const { headers: allHeaders, rows: rawRows } = sheetToRows(dataSheet);

  const dataErrors = validateDataSheet(allHeaders, rawRows);
  if (dataErrors.length > 0) return { model: null, errors: dataErrors };

  // Parse groups
  let groups: DataGroup[] = defaultGroups;
  const groupsSheet = wb.getWorksheet(workbookSheetNames.groups);
  if (groupsSheet) {
    const gs = sheetToRows(groupsSheet).rows;
    const gErrors = validateGroupsSheet(gs);
    if (gErrors.length > 0) return { model: null, errors: gErrors };
    groups = gs.map(r => ({
      groupKey: String(r["GroupKey"]),
      displayName: String(r["DisplayName"]),
      color: String(r["Color"]),
      sortOrder: Number(r["SortOrder"]),
      defaultVisible: String(r["DefaultVisible"]).toUpperCase() === "TRUE",
    }));
  }

  // Parse variables
  let variables: VariableDefinition[] = defaultVariables;
  const variablesSheet = wb.getWorksheet(workbookSheetNames.variables);
  if (variablesSheet) {
    const vs = sheetToRows(variablesSheet).rows;
    const vErrors = validateVariablesSheet(vs, groups.map(g => g.groupKey));
    if (vErrors.length > 0) return { model: null, errors: vErrors };
    variables = vs.map(r => ({
      variableKey: String(r["VariableKey"]),
      displayName: String(r["DisplayName"]),
      groupKey: String(r["GroupKey"]),
      unit: String(r["Unit"] ?? "-"),
      dataType: String(r["DataType"]) as "number"|"string"|"boolean"|"date",
      sortOrder: Number(r["SortOrder"]),
      defaultVisible: String(r["DefaultVisible"]).toUpperCase() === "TRUE",
      source: String(r["Source"]) as "file"|"derived",
    }));
  }

  const rows: DataRow[] = rawRows.map(raw => {
    const row: DataRow = {};
    for (const key of Object.keys(raw)) {
      const val = raw[key];
      const varDef = variables.find(v => v.variableKey === key);
      if (!varDef) { row[key] = val as DataValue; continue; }
      if (val === null || val === undefined) { row[key] = null; continue; }
      switch (varDef.dataType) {
        case "number": row[key] = typeof val === "number" ? val : parseFloat(String(val)); break;
        case "boolean": row[key] = val === true || String(val).toUpperCase() === "TRUE"; break;
        case "date": row[key] = val instanceof Date ? val : (typeof val === "string" ? new Date(val) : null); break;
        default: row[key] = String(val);
      }
    }
    return row;
  });

  return {
    model: {
      fileName: file.name,
      worksheetName: dataSheet.name,
      loadedAtIso: new Date().toISOString(),
      isSample: false,
      groups,
      variables,
      rows,
    },
    errors: [],
  };
}
