#!/usr/bin/env pwsh

# Konfigurasi Path
$PortableConfigPath = "D:\Coding\opencode-portable\config\antigravity-accounts.json"
$UserConfigPath = "C:\Users\MP2DX\.config\opencode\antigravity-accounts.json"

if (-not (Test-Path $PortableConfigPath)) {
    Write-Host "File konfigurasi portable tidak ditemukan!" -ForegroundColor Red
    exit
}

# Load Data
$PortableData = Get-Content $PortableConfigPath | ConvertFrom-Json
$UserData = Get-Content $UserConfigPath | ConvertFrom-Json

$Accounts = $PortableData.accounts
$ApiKeys = $UserData.value | Where-Object { $_.provider -eq "google" }

Write-Host "--- Antigravity Rotation System (ARS) ---" -ForegroundColor Yellow

# 1. Rotasi Berdasarkan Kuota Email
# 1. Rotasi Berdasarkan Kuota Email (Threshold 20%)
$BestAccountIndex = $PortableData.activeIndex
$MaxQuota = -1
$CurrentActiveQuota = $Accounts[$PortableData.activeIndex].cachedQuota."gemini-flash".remainingFraction

if ($CurrentActiveQuota -lt 0.2) {
    Write-Host "[!] Kuota aktif menipis ($($CurrentActiveQuota * 100)%). Mencari rotasi..." -ForegroundColor Yellow
    for ($i = 0; $i -lt $Accounts.Count; $i++) {
        $Quota = $Accounts[$i].cachedQuota."gemini-flash".remainingFraction
        if ($Quota -gt $MaxQuota) {
            $MaxQuota = $Quota
            $BestAccountIndex = $i
        }
    }
} else {
    $MaxQuota = $CurrentActiveQuota
    $BestAccountIndex = $PortableData.activeIndex
}

$MaxQuota = -1

for ($i = 0; $i -lt $Accounts.Count; $i++) {
    $Quota = $Accounts[$i].cachedQuota."gemini-flash".remainingFraction
    if ($Quota -gt $MaxQuota) {
        $MaxQuota = $Quota
        $BestAccountIndex = $i
    }
}

# 2. Logika Rotasi API Key (Health Check)
$ActiveKeys = @()
foreach ($key in $ApiKeys) {
    if ($key.apiKey -ne $null -and $key.apiKey.StartsWith("AIza")) {
        $ActiveKeys += $key.apiKey
    }
}
$CurrentApiKey = $ActiveKeys[($PortableData.activeIndex % $ActiveKeys.Count)]

if ($PortableData.activeIndex -ne $BestAccountIndex) {
    $OldEmail = $Accounts[$PortableData.activeIndex].email
    $NewEmail = $Accounts[$BestAccountIndex].email
    
    $PortableData.activeIndex = $BestAccountIndex
    $PortableData.activeIndexByFamily.claude = $BestAccountIndex
    $PortableData.activeIndexByFamily.gemini = $BestAccountIndex
    
    # Inject Metadata
    $PortableData.lastUsedApiKey = $CurrentApiKey
    $PortableData.ars_status = "HEALTHY"

    $PortableData | ConvertTo-Json -Depth 10 | Set-Content $PortableConfigPath
    
    Write-Host "[OK] Berhasil beralih ke: $NewEmail (Kuota: $($MaxQuota * 100)%)" -ForegroundColor Green

    # 3. Notifikasi Windows (Toast)
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
        $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
        $objNotifyIcon.BalloonTipIcon = "Info"
        $objNotifyIcon.BalloonTipText = "Beralih ke: $NewEmail`nKuota: $($MaxQuota * 100)%`nKey: $($CurrentApiKey.Substring(0,8))"
        $objNotifyIcon.BalloonTipTitle = "Antigravity Rotasi Dewa"
        $objNotifyIcon.Visible = $True
        $objNotifyIcon.ShowBalloonTip(5000)
    } catch {}
} else {
    Write-Host "[STABLE] Tetap di akun: $($Accounts[$BestAccountIndex].email) (Kuota: $($MaxQuota * 100)%)" -ForegroundColor Cyan
}

Write-Host "[INFO] API Key Aktif: $($CurrentApiKey.Substring(0,10))..." -ForegroundColor DarkGray
Write-Host "----------------------------------------"
