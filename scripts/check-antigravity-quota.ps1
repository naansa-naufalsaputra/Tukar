# check-antigravity-quota.ps1
# Script to verify health and simulated quota for Antigravity API Keys

$AccountsPath = "C:\Users\MP2DX\.config\opencode\antigravity-accounts.json"

if (-not (Test-Path $AccountsPath)) {
    Write-Host "[ERROR] Accounts file not found!" -ForegroundColor Red
    exit
}

$Accounts = Get-Content $AccountsPath | ConvertFrom-Json
$Total = $Accounts.Count

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "   ANTIGRAVITY QUOTA & HEALTH CHECK  " -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan
Write-Host "Found $Total account(s). Probing...`n" -ForegroundColor Gray

$Results = @()

foreach ($Acc in $Accounts) {
    $Key = $Acc.apiKey
    $HiddenKey = $Key.Substring(0, 8) + "..." + $Key.Substring($Key.Length - 4)
    Write-Host "Checking Key: $HiddenKey " -NoNewline
    
    $StartTime = Get-Date
    try {
        # Testing with a very small prompt to save actual quota
        $Body = @{
            contents = @(@{
                    parts = @(@{ text = "ping" })
                })
        } | ConvertTo-Json

        $Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$Key"
        $Response = Invoke-RestMethod -Uri $Url -Method Post -Body $Body -ContentType "application/json" -ErrorAction Stop
        
        $Duration = (Get-Date) - $StartTime
        Write-Host "[OK] " -ForegroundColor Green -NoNewline
        Write-Host "($( [math]::Round($Duration.TotalMilliseconds) )ms)" -ForegroundColor Gray
        
        $Results += [PSCustomObject]@{
            Key     = $HiddenKey
            Status  = "ACTIVE"
            Latency = "$([math]::Round($Duration.TotalMilliseconds))ms"
        }
    }
    catch {
        Write-Host "[FAILED] " -ForegroundColor Red
        Write-Host "Reason: $($_.Exception.Message)" -ForegroundColor Gray
        $Results += [PSCustomObject]@{
            Key     = $HiddenKey
            Status  = "ERROR/LIMITED"
            Latency = "N/A"
        }
    }
}

Write-Host "`n------------------------------------"
$Results | Format-Table -AutoSize
Write-Host "------------------------------------"
Write-Host "Tip: If status is LIMITED, OpenCode will automatically rotate to the next key." -ForegroundColor Yellow
