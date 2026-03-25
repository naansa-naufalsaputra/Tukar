# Opencode Guard - Maintenance & Safety Script

function Invoke-OpenCodeUpdateCheck {
    Write-Host "Checking for OpenCode updates..." -ForegroundColor Cyan
    try {
        # npm outdated --json returns 1 if updates found
        $outdatedJson = npm outdated -g opencode-ai --json 2>$null
        if ($outdatedJson) {
            $updateInfo = $outdatedJson | ConvertFrom-Json
            if ($updateInfo.'opencode-ai') {
                $current = $updateInfo.'opencode-ai'.current
                $latest = $updateInfo.'opencode-ai'.latest
                Write-Host "[UPDATE] OpenCode $latest is available! (Current: $current)" -ForegroundColor Magenta
                Write-Host "Run 'Update-OpenCode' to upgrade." -ForegroundColor Gray
                return $true
            }
        }
    }
    catch {}
    Write-Host "[OK] OpenCode is up-to-date." -ForegroundColor Green
    return $false
}

function Remove-OpenCodeTempFiles {
    Write-Host "Cleaning temporary logs and build files..." -ForegroundColor Cyan
    Remove-Item -Path "*.log", "*.tmp", "build_log*.txt", "gradle_error*.log", "tsc_output*.txt", "health_check.log" -ErrorAction SilentlyContinue
    Write-Host "Cleanup complete." -ForegroundColor Green
}

function Update-OpenCode {
    Write-Host "Updating OpenCode..." -ForegroundColor Cyan
    npm install -g opencode-ai@latest
    Write-Host "Update successful!" -ForegroundColor Green
}

function Test-OpenCodeSafety {
    Write-Host "Verifying safety configurations..." -ForegroundColor Cyan
    $configPath = "$env:USERPROFILE\.config\opencode\opencode.json"
    if (Test-Path $configPath) {
        $config = Get-Content $configPath | ConvertFrom-Json
        if ($config.plugin -contains "cc-safety-net") {
            Write-Host "[OK] cc-safety-net is active." -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] cc-safety-net is NOT found in plugins!" -ForegroundColor Yellow
        }
        
        if ($config.rotationThreshold) {
            Write-Host "[OK] Rotation Threshold set to $($config.rotationThreshold * 100)%." -ForegroundColor Green
        }
    }
    else {
        Write-Host "[ERROR] opencode.json not found!" -ForegroundColor Red
    }
}

function Invoke-AccountRotation {
    Write-Host "Checking for proactive account rotation (Threshold 20%)..." -ForegroundColor Cyan
    $accountsPath = "$env:USERPROFILE\.config\opencode\antigravity-accounts.json"
    if (Test-Path $accountsPath) {
        $accounts = Get-Content $accountsPath | ConvertFrom-Json
        if ($accounts.Count -gt 1) {
            # Move the first account to the end of the list
            $rotated = $accounts[1..($accounts.Count - 1)] + $accounts[0]
            $rotated | ConvertTo-Json -Depth 10 | Set-Content $accountsPath
            Write-Host "Rotation successful! Fresh account moved to priority 1." -ForegroundColor Green
        }
        else {
            Write-Host "Only 1 account found. Rotation skipped." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[ERROR] antigravity-accounts.json not found!" -ForegroundColor Red
    }
}

function Test-Connectivity {
    Write-Host "Running Connectivity Health Check..." -ForegroundColor Cyan
    Write-Host "(This might be slow if the API is warming up...)" -ForegroundColor Gray
    try {
        # Using a ultra-fast model and a minimal prompt to speed up connectivity check
        $testPrompt = "hello"
        $response = opencode --prompt $testPrompt --model "google/gemini-3-flash-preview" --skip-scan
        if ($response) {
            Write-Host "[OK] Connectivity confirmed. System is DEWA." -ForegroundColor Green
            return "SUCCESS"
        }
        else {
            Write-Host "[WARNING] System responded but format was empty." -ForegroundColor Yellow
            return "WARNING"
        }
    }
    catch {
        Write-Host "[ERROR] Connectivity failed! Account might be limited or API key invalid." -ForegroundColor Red
        return "FAILED"
    }
}

function Test-Config {
    Write-Host "Validating opencode.json structure..." -ForegroundColor Cyan
    $validScript = "d:\Coding\tukar\validate-config.ps1"
    if (Test-Path $validScript) {
        powershell.exe -File $validScript -NoPause
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Configuration validation FAILED!" -ForegroundColor Red
            return $false
        }
        Write-Host "[OK] Configuration is sound." -ForegroundColor Green
    }
    return $true
}

function Start-GeminiRouterIfNeeded {
    Write-Host "Ensuring local Gemini router is running..." -ForegroundColor Cyan
    $routerScript = "d:\Coding\tukar\gemini-router\start-router.ps1"
    if (Test-Path $routerScript) {
        powershell.exe -ExecutionPolicy Bypass -File $routerScript | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Gemini router ready." -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] Gemini router did not start. Check gemini-router\.env" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[WARNING] Router startup script not found at $routerScript" -ForegroundColor Yellow
    }
}

function Sync-GeminiRouterCredentials {
    Write-Host "Syncing OAuth + API keys into local router env..." -ForegroundColor Cyan
    $syncScript = "d:\Coding\tukar\gemini-router\sync-credentials.ps1"
    if (Test-Path $syncScript) {
        powershell.exe -ExecutionPolicy Bypass -File $syncScript | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Router credentials synced." -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] Router credential sync failed." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[WARNING] Credential sync script not found at $syncScript" -ForegroundColor Yellow
    }
}
function Invoke-QuotaMaintenance {
    Write-Host "Triggering Quota Refresh & Status Update..." -ForegroundColor Cyan
    $refreshScript = "d:\Coding\tukar\refresh-quota.ps1"
    $statusScript = "d:\Coding\tukar\status-dewa.ps1"
    if (Test-Path $refreshScript) {
        powershell.exe -ExecutionPolicy Bypass -File $refreshScript | Out-Null
        Write-Host "[OK] Quota data refreshed." -ForegroundColor Green
    }
    if (Test-Path $statusScript) {
        # Get status and print summary line to console/log
        powershell.exe -ExecutionPolicy Bypass -File $statusScript | Select-Object -First 10
    }
}

# Execution
# Execution
Clear-Host
$LogPath = "d:\Coding\tukar\health_check.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "====================================" -ForegroundColor Yellow
Write-Host "      OPENCODE GUARD SYSTEM         " -ForegroundColor Yellow
Write-Host "====================================`n" -ForegroundColor Yellow

Invoke-OpenCodeUpdateCheck
Invoke-QuotaMaintenance
Write-Host "`n------------------------------------"
Remove-OpenCodeTempFiles
Write-Host "------------------------------------"
Test-Config
Write-Host "------------------------------------"
Sync-GeminiRouterCredentials
Write-Host "------------------------------------"
Start-GeminiRouterIfNeeded
Write-Host "------------------------------------"
Test-OpenCodeSafety
Write-Host "------------------------------------"
Invoke-AccountRotation
Write-Host "------------------------------------"
$Status = Test-Connectivity

# Log the result
"$Timestamp | Status: $Status" | Out-File -FilePath $LogPath -Append

Write-Host "`nDone." -ForegroundColor Yellow
