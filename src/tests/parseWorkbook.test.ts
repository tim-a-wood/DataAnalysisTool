import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parseWorkbookFile } from "../xlsx/parseWorkbook";
import { validateFile, validateSheets } from "../xlsx/validateWorkbook";
import type { ParsedSheets } from "../xlsx/validateWorkbook";

describe("validateFile", () => {
  it("returns error for non-xlsx file", () => {
    const file = { name: "data.csv", size: 1000 } as File;
    expect(validateFile(file)).toMatch(/XLSX/i);
  });

  it("returns error for oversized file", () => {
    const file = { name: "data.xlsx", size: 21 * 1024 * 1024 } as File;
    expect(validateFile(file)).toMatch(/20 MB/i);
  });

  it("returns null for valid file", () => {
    const file = { name: "data.xlsx", size: 1024 } as File;
    expect(validateFile(file)).toBeNull();
  });
});

describe("validateSheets", () => {
  it("returns error when Case column is missing", () => {
    const sheets: ParsedSheets = {
      dataRows: [{ GrossWeight: 70000 }],
      dataHeaders: ["GrossWeight"],
      groups: null,
      variables: null,
    };
    const errors = validateSheets(sheets);
    expect(errors.some(e => e.includes("Case"))).toBe(true);
  });

  it("returns error for duplicate Case values", () => {
    const sheets: ParsedSheets = {
      dataRows: [{ Case: 1 }, { Case: 1 }],
      dataHeaders: ["Case"],
      groups: null,
      variables: null,
    };
    const errors = validateSheets(sheets);
    expect(errors.some(e => e.includes("Duplicate") || e.includes("duplicate"))).toBe(true);
  });

  it("returns error for non-numeric Case value", () => {
    const sheets: ParsedSheets = {
      dataRows: [{ Case: "not-a-number" }],
      dataHeaders: ["Case"],
      groups: null,
      variables: null,
    };
    const errors = validateSheets(sheets);
    expect(errors.some(e => e.includes("finite") || e.includes("not a finite"))).toBe(true);
  });

  it("returns no errors for valid data", () => {
    const sheets: ParsedSheets = {
      dataRows: [{ Case: 1 }, { Case: 2 }, { Case: 3 }],
      dataHeaders: ["Case"],
      groups: null,
      variables: null,
    };
    const errors = validateSheets(sheets);
    expect(errors).toHaveLength(0);
  });
});

describe("parseWorkbookFile", () => {
  it("parses a workbook with Data, Groups, and Variables sheets", async () => {
    const workbook = new ExcelJS.Workbook();
    const data = workbook.addWorksheet("Data");
    data.addRow(["Case", "Altitude", "IsValid"]);
    data.addRow([1, 12000, true]);

    const groups = workbook.addWorksheet("Groups");
    groups.addRow(["GroupKey", "DisplayName", "Color", "SortOrder", "DefaultVisible"]);
    groups.addRow(["performance", "Performance", "#00E8C8", 1, "TRUE"]);

    const variables = workbook.addWorksheet("Variables");
    variables.addRow(["VariableKey", "DisplayName", "GroupKey", "Unit", "DataType", "SortOrder", "DefaultVisible", "Source"]);
    variables.addRow(["Case", "Case", "performance", "-", "number", 0, "TRUE", "file"]);
    variables.addRow(["Altitude", "Altitude", "performance", "ft", "number", 1, "TRUE", "file"]);
    variables.addRow(["IsValid", "Is Valid", "performance", "-", "boolean", 2, "TRUE", "file"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([buffer], "data.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await parseWorkbookFile(file);

    expect(result.errors).toHaveLength(0);
    expect(result.model?.groups).toHaveLength(1);
    expect(result.model?.variables).toHaveLength(3);
    expect(result.model?.rows).toEqual([{ Case: 1, Altitude: 12000, IsValid: true }]);
  });

  it("parses a workbook with visual group headers above variable headers", async () => {
    const workbook = new ExcelJS.Workbook();
    const data = workbook.addWorksheet("Data");
    data.addRow(["Performance", "Performance", "Status"]);
    data.addRow(["Case", "Altitude", "IsValid"]);
    data.addRow([1, 12000, true]);

    const groups = workbook.addWorksheet("Groups");
    groups.addRow(["GroupKey", "DisplayName", "Color", "SortOrder", "DefaultVisible"]);
    groups.addRow(["performance", "Performance", "#00E8C8", 1, "TRUE"]);
    groups.addRow(["status", "Status", "#2f8cff", 2, "TRUE"]);

    const variables = workbook.addWorksheet("Variables");
    variables.addRow(["VariableKey", "DisplayName", "GroupKey", "Unit", "DataType", "SortOrder", "DefaultVisible", "Source"]);
    variables.addRow(["Case", "Case", "performance", "-", "number", 0, "TRUE", "file"]);
    variables.addRow(["Altitude", "Altitude", "performance", "ft", "number", 1, "TRUE", "file"]);
    variables.addRow(["IsValid", "Is Valid", "status", "-", "boolean", 2, "TRUE", "file"]);

    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([buffer], "grouped-data.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await parseWorkbookFile(file);

    expect(result.errors).toHaveLength(0);
    expect(result.model?.rows).toEqual([{ Case: 1, Altitude: 12000, IsValid: true }]);
  });
});
