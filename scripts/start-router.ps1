$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir ".env"
$syncScript = Join-Path $scriptDir "sync-credentials.ps1"

if (Test-Path $syncScript) {
    powershell.exe -ExecutionPolicy Bypass -File $syncScript | Out-Null
}

if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env not found at $envFile" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and fill tokens first." -ForegroundColor Yellow
    exit 1
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
        return
    }
    $eq = $line.IndexOf("=")
    if ($eq -le 0) {
        return
    }
    $key = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    Set-Item -Path "env:$key" -Value $value
}

$port = if ($env:PORT) { $env:PORT } else { "8787" }
$existing = Get-NetTCPConnection -LocalAddress "127.0.0.1" -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if ($existing) {
    Write-Host "[OK] Gemini router already running on 127.0.0.1:$port" -ForegroundColor Green
    exit 0
}

Write-Host "[INFO] Starting Gemini router on 127.0.0.1:$port" -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.mjs" -WorkingDirectory $scriptDir -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 1
$verify = Get-NetTCPConnection -LocalAddress "127.0.0.1" -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($verify) {
    Write-Host "[OK] Gemini router started." -ForegroundColor Green
    exit 0
}

Write-Host "[ERROR] Router failed to start." -ForegroundColor Red
exit 1
