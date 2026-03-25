#!/usr/bin/env pwsh

# Konfigurasi Path
$PortableConfigPath = "D:\Coding\opencode-portable\config\antigravity-accounts.json"
$OhMyPath = "D:\Coding\opencode-portable\config\oh-my-opencode.json"

function Get-QuotaColor($fraction) {
    if ($fraction -gt 0.7) { return "Green" }
    if ($fraction -gt 0.3) { return "Yellow" }
    return "Red"
}

Write-Host "`n=== 🌌 ANTIGRAVITY DEWA STATUS ===`n" -ForegroundColor Cyan

# 1. Cek Google Accounts (OAuth)
if (Test-Path $PortableConfigPath) {
    $Data = Get-Content $PortableConfigPath | ConvertFrom-Json
    Write-Host "[ GOOGLE ACCOUNTS ]" -ForegroundColor Yellow
    Write-Host "{ Index } { Email }                      { Gemini Flash } { Claude }" -ForegroundColor Gray
    
    $i = 0
    foreach ($acc in $Data.accounts) {
        $mark = if ($i -ne $Data.activeIndex) { "  " } else { ">>" }
        $flashQ = $acc.cachedQuota."gemini-flash".remainingFraction
        $claudeQ = $acc.cachedQuota."claude".remainingFraction
        
        $colorF = Get-QuotaColor $flashQ
        $colorC = Get-QuotaColor $claudeQ
        
        Write-Host "$mark [$i]     $($acc.email.PadRight(28)) " -NoNewline
        Write-Host "$([math]::Round($flashQ * 100))%".PadRight(15) -ForegroundColor $colorF -NoNewline
        Write-Host "$([math]::Round($claudeQ * 100))%" -ForegroundColor $colorC
        $i++
    }
}

# 2. Cek GitHub Copilot Integration
if (Test-Path $OhMyPath) {
    $OhMyData = Get-Content $OhMyPath | ConvertFrom-Json
    Write-Host "`n[ GITHUB COPILOT FALLBACK ]" -ForegroundColor Yellow
    $copilotAgents = $OhMyData.agents.psobject.properties | Where-Object { $_.Value.model -match "github-copilot" }
    Write-Host "Status: " -NoNewline
    if ($copilotAgents.Count -gt 0) {
        Write-Host "ACTIVE (Bridging through $($copilotAgents.Count) agents)" -ForegroundColor Green
    } else {
        Write-Host "INACTIVE" -ForegroundColor Red
    }
}

Write-Host "`n==================================`n"
