<#
  भू DRISTI — one-command setup for Windows (PowerShell).
  Usage:  powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
          powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -NoRun
#>
param([switch]$NoRun)
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "frontend"

Write-Host "==> भू DRISTI setup (Windows)" -ForegroundColor Cyan

# 1. Check Node.js (>= 18.17)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed. Install Node 20 LTS from https://nodejs.org and re-run."
  exit 1
}
$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) {
  Write-Error "Node $(node -v) found; this project needs Node >= 18.17 (20 LTS recommended)."
  exit 1
}
Write-Host "    Node $(node -v), npm $(npm -v)"

# 2. Install dependencies
Write-Host "==> Installing frontend dependencies (npm install)..." -ForegroundColor Cyan
Set-Location $Frontend
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed."; exit 1 }

# 3. Type-check
Write-Host "==> Type-checking..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) { Write-Error "Type-check failed."; exit 1 }

Write-Host ""
Write-Host "==> Setup complete." -ForegroundColor Green
Write-Host "    Frontend ready in: $Frontend"

# 4. Optionally start the dev server
if ($NoRun) {
  Write-Host "    Start it anytime with:  cd frontend ; npm run dev"
  Write-Host "    Then open http://localhost:3000"
  exit 0
}

Write-Host "==> Starting dev server on http://localhost:3000  (Ctrl+C to stop)" -ForegroundColor Cyan
npm run dev
