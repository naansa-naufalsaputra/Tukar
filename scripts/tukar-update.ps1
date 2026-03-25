# Tukar Update Utility
# Runs full updates for OpenCode and related tools.

Write-Host "--- TUKAR UPDATE SYSTEM ---" -ForegroundColor Yellow

$guardPath = "d:\Coding\tukar\opencode-guard.ps1"

Write-Host "`n[1] Updating OpenCode-AI (Global)..." -ForegroundColor Cyan
npm install -g opencode-ai@latest

Write-Host "`n[2] Running Maintenance Guard..." -ForegroundColor Cyan
if (Test-Path $guardPath) {
    powershell.exe -ExecutionPolicy Bypass -File $guardPath
}
else {
    Write-Host "[WARNING] opencode-guard.ps1 not found in D:\Coding\tukar" -ForegroundColor Yellow
}

Write-Host "`n--- UPDATE COMPLETE ---" -ForegroundColor Green
Write-Host "System is now at version: " -NoNewline
opencode --version

Write-Host "`nPress Enter to exit..." -ForegroundColor Gray
Read-Host
