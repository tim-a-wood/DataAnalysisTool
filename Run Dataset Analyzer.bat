@echo off
setlocal
title Dataset Analyzer Launcher

cd /d "%~dp0"

call :refresh_node_path

where node >nul 2>nul
if errorlevel 1 goto install_node

where npm >nul 2>nul
if errorlevel 1 goto install_node

goto run_app

:install_node
echo.
echo ==^> Installing Node.js LTS from nodejs.org
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $releases=Invoke-RestMethod 'https://nodejs.org/dist/index.json'; $latest=$releases | Where-Object { $_.lts -ne $false } | Select-Object -First 1; if (-not $latest) { throw 'Could not determine the latest Node.js LTS version.' }; $arch=if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq 'Arm64') { 'arm64' } else { 'x64' }; $name='node-' + $latest.version + '-' + $arch + '.msi'; $url='https://nodejs.org/dist/' + $latest.version + '/' + $name; $path=Join-Path $env:TEMP $name; Write-Host ('Downloading ' + $url); Invoke-WebRequest -Uri $url -OutFile $path; Write-Host 'Starting Node.js installer'; $process=Start-Process 'msiexec.exe' -ArgumentList @('/i', $path, '/passive', '/norestart') -Wait -PassThru; if ($process.ExitCode -notin @(0,3010)) { throw ('Node.js installer failed with exit code ' + $process.ExitCode) }; if ($process.ExitCode -eq 3010) { Write-Host 'Node.js requested a restart, but the launcher will try to continue now.' }"
if errorlevel 1 goto failed

call :refresh_node_path

where node >nul 2>nul
if errorlevel 1 goto node_missing

where npm >nul 2>nul
if errorlevel 1 goto node_missing

:run_app
echo.
echo ==^> Using Node.js and npm
node --version
npm --version

if not exist node_modules (
  echo.
  echo ==^> Installing app dependencies
  call npm install
  if errorlevel 1 goto failed
) else (
  echo.
  echo ==^> Dependencies already installed
)

echo.
echo ==^> Starting Dataset Analyzer
echo The browser should open automatically. If it does not, open the local URL printed below.
call npm run dev -- --host 127.0.0.1 --open
if errorlevel 1 goto failed

goto done

:refresh_node_path
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%LocalAppData%\Programs\nodejs;%PATH%"
for /f "usebackq delims=" %%P in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$machine=[Environment]::GetEnvironmentVariable('Path','Machine'); $user=[Environment]::GetEnvironmentVariable('Path','User'); Write-Output ($machine + ';' + $user)" 2^>nul`) do set "PATH=%%P;%PATH%"
exit /b 0

:node_missing
echo.
echo Node.js/npm still were not found after install.
echo Close this window, open a new Command Prompt in this folder, and run:
echo Run Dataset Analyzer.bat
goto failed

:failed
echo.
echo Dataset Analyzer did not start successfully.
pause
exit /b 1

:done
