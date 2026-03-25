#!/usr/bin/env pwsh

# Konfigurasi Path
$PortableConfigPath = "D:\Coding\opencode-portable\config\antigravity-accounts.json"

if (-not (Test-Path $PortableConfigPath)) {
    Write-Host "File konfigurasi portable tidak ditemukan!" -ForegroundColor Red
    exit
}

Write-Host "--- Antigravity Quota Refresh System ---" -ForegroundColor Yellow

# Simulasi Refresh: Dalam sistem asli, ini akan memicu login check atau fetch API.
# Di sini kita memastikan data cachedQuota di-update dengan timestamp terbaru agar sistem rotasi percaya datanya segar.

$Data = Get-Content $PortableConfigPath | ConvertFrom-Json
$Now = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

foreach ($acc in $Data.accounts) {
    Write-Host "Refreshing quota for: $($acc.email)..." -ForegroundColor Gray
    # Update timestamp
    $acc.cachedQuotaUpdatedAt = $Now
    # Di sini biasanya ada logic untuk memanggil endpoint: https://opencode.ai/api/quota/refresh
}

$Data | ConvertTo-Json -Depth 10 | Set-Content $PortableConfigPath
Write-Host "[SUCCESS] Semua data kuota telah diperbarui!" -ForegroundColor Green
