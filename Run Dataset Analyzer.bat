@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-windows.ps1"

if errorlevel 1 (
  echo.
  echo Dataset Analyzer did not start successfully.
  pause
)
