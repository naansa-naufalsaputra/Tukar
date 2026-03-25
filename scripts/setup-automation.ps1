# Setup-OpenCodeAutomation.ps1
# Run this script to register OpenCode Guard in Windows Task Scheduler

# --- Administrator Check & Elevation ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}
# ----------------------------------------

$ScriptName = "opencode-guard.ps1"
$ScriptPath = "d:\Coding\tukar\$ScriptName"
$TaskName = "OpenCodeGuardDaily"

Clear-Host
Write-Host "Setting up Automation for $TaskName..." -ForegroundColor Cyan

# Define the action (Run the PowerShell script)
$Action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""

# Define the trigger (Daily at 10:00 AM)
$Trigger = New-ScheduledTaskTrigger -Daily -At 10am

# Define the settings (Allow running on battery, etc.)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register the task
try {
    Register-ScheduledTask -Action $Action -Trigger $Trigger -Settings $Settings -TaskName $TaskName -Description "Runs OpenCode maintenance and account rotation daily." -Force
    Write-Host "`nSuccess! OpenCode Guard is now scheduled to run every day at 10:00 AM." -ForegroundColor Green
    Write-Host "You can manage this task in 'Task Scheduler' under names: $TaskName" -ForegroundColor Yellow
}
catch {
    Write-Host "`n[ERROR] Failed to register task: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPress Enter to close this window..." -ForegroundColor Gray
Read-Host
