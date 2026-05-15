$ErrorActionPreference = "Stop"

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Add-NodeToPathIfInstalled {
  $candidates = @(
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path "$candidate\node.exe")) {
      $env:Path = "$candidate;$env:Path"
      return $true
    }
  }

  return $false
}

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Get-LatestNodeLtsVersion {
  Write-Step "Finding the latest Node.js LTS installer"
  $releases = Invoke-RestMethod "https://nodejs.org/dist/index.json"
  $latestLts = $releases | Where-Object { $_.lts -ne $false } | Select-Object -First 1
  if (-not $latestLts) {
    throw "Could not determine the latest Node.js LTS version."
  }
  return $latestLts.version
}

function Install-Node {
  $version = Get-LatestNodeLtsVersion
  $arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "Arm64") { "arm64" } else { "x64" }
  $installerName = "node-$version-$arch.msi"
  $installerUrl = "https://nodejs.org/dist/$version/$installerName"
  $installerPath = Join-Path $env:TEMP $installerName

  Write-Step "Downloading Node.js $version ($arch)"
  Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

  Write-Step "Installing Node.js. Approve the Windows installer prompt if one appears"
  $process = Start-Process "msiexec.exe" -ArgumentList "/i", "`"$installerPath`"", "/passive", "/norestart" -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Node.js installer failed with exit code $($process.ExitCode)."
  }

  Add-NodeToPathIfInstalled | Out-Null
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
  Add-NodeToPathIfInstalled | Out-Null
}

if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
  Install-Node
}

if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
  throw "Node.js/npm still were not found after install. Restart Windows and run this launcher again."
}

Write-Step "Using Node $(node --version) and npm $(npm --version)"

if (-not (Test-Path "node_modules")) {
  Write-Step "Installing app dependencies"
  npm install
} else {
  Write-Step "Dependencies already installed"
}

Write-Step "Starting Dataset Analyzer"
Write-Host "The browser should open automatically. If it does not, open the local URL printed below."
npm run dev -- --host 127.0.0.1 --open
