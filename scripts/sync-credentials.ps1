$ErrorActionPreference = "Stop"

$routerDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $routerDir ".env"
$envExamplePath = Join-Path $routerDir ".env.example"
$authPath = "$env:USERPROFILE\.local\share\opencode\auth.json"
$apiPoolPath = "$env:USERPROFILE\.config\opencode\antigravity-accounts.json"

if (-not (Test-Path $envPath)) {
    if (-not (Test-Path $envExamplePath)) {
        Write-Host "[ERROR] .env.example not found." -ForegroundColor Red
        exit 1
    }
    Copy-Item $envExamplePath $envPath -Force
}

$envMap = @{}
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
        return
    }
    $parts = $line.Split("=", 2)
    $envMap[$parts[0].Trim()] = $parts[1]
}

$oauthToken = ""
if (Test-Path $authPath) {
    try {
        $auth = Get-Content $authPath -Raw | ConvertFrom-Json
        if ($auth.google -and $auth.google.access) {
            $oauthToken = [string]$auth.google.access
        }
    }
    catch {}
}

$apiKeys = @()
$geminiApiKey = [string]$env:GEMINI_API_KEY
if ($geminiApiKey) {
    $apiKeys += $geminiApiKey
}

if (Test-Path $apiPoolPath) {
    try {
        $pool = Get-Content $apiPoolPath -Raw | ConvertFrom-Json
        foreach ($item in $pool) {
            if ($item.provider -eq "google" -and $item.apiKey -and $item.apiKey.StartsWith("AIza")) {
                if ($apiKeys -notcontains $item.apiKey) {
                    $apiKeys += [string]$item.apiKey
                }
            }
        }
    }
    catch {}
}

if (-not $oauthToken -and $apiKeys.Count -eq 0) {
    Write-Host "[ERROR] No OAuth token or Gemini API key found to sync." -ForegroundColor Red
    exit 1
}

$envMap["DEFAULT_MODEL"] = if ($envMap["DEFAULT_MODEL"]) { $envMap["DEFAULT_MODEL"] } else { "gemini-3.1-pro-preview" }
$envMap["MODEL_ORDER"] = "gemini-3.1-pro-preview,gemini-3-flash-preview,gemini-2.5-flash"
$envMap["PROVIDER_ORDER"] = "oauth-main,key-primary,key-secondary"
$envMap["PROVIDER_OAUTH_MAIN_TYPE"] = "oauth"
$envMap["PROVIDER_KEY_PRIMARY_TYPE"] = "apikey"
$envMap["PROVIDER_KEY_SECONDARY_TYPE"] = "apikey"
$hasExistingOauthInEnv = $envMap.ContainsKey("PROVIDER_OAUTH_MAIN_TOKEN") -and -not [string]::IsNullOrWhiteSpace([string]$envMap["PROVIDER_OAUTH_MAIN_TOKEN"])
if (-not [string]::IsNullOrWhiteSpace($oauthToken)) {
    $envMap["PROVIDER_OAUTH_MAIN_TOKEN"] = $oauthToken
}
elseif (-not $hasExistingOauthInEnv) {
    $envMap["PROVIDER_OAUTH_MAIN_TOKEN"] = ""
}
$envMap["PROVIDER_KEY_PRIMARY_TOKEN"] = if ($apiKeys.Count -ge 1) { $apiKeys[0] } else { "" }
$envMap["PROVIDER_KEY_SECONDARY_TOKEN"] = if ($apiKeys.Count -ge 2) { $apiKeys[1] } else { "" }

$orderedKeys = @(
    "PORT",
    "DEFAULT_MODEL",
    "MODEL_ORDER",
    "REQUEST_TIMEOUT_MS",
    "MAX_RETRIES_PER_REQUEST",
    "COOLDOWN_MS",
    "MAX_429_BEFORE_COOLDOWN",
    "MAX_5XX_BEFORE_COOLDOWN",
    "PROVIDER_ORDER",
    "PROVIDER_OAUTH_MAIN_TYPE",
    "PROVIDER_OAUTH_MAIN_TOKEN",
    "PROVIDER_KEY_PRIMARY_TYPE",
    "PROVIDER_KEY_PRIMARY_TOKEN",
    "PROVIDER_KEY_SECONDARY_TYPE",
    "PROVIDER_KEY_SECONDARY_TOKEN",
    "PROVIDER_OAUTH_MAIN_BUDGET_USED_PCT",
    "PROVIDER_KEY_PRIMARY_BUDGET_USED_PCT",
    "PROVIDER_KEY_SECONDARY_BUDGET_USED_PCT"
)

$lines = @()
foreach ($key in $orderedKeys) {
    $value = if ($envMap.ContainsKey($key)) { [string]$envMap[$key] } else { "" }
    $lines += "$key=$value"
}

Set-Content -Path $envPath -Value ($lines -join [Environment]::NewLine)

$oauthState = if (-not [string]::IsNullOrWhiteSpace($oauthToken)) {
    "SET"
}
elseif ($hasExistingOauthInEnv) {
    "PRESERVED"
}
else {
    "EMPTY"
}
$primaryState = if ($apiKeys.Count -ge 1) { "SET" } else { "EMPTY" }
$secondaryState = if ($apiKeys.Count -ge 2) { "SET" } else { "EMPTY" }
Write-Host "[OK] Synced credentials: oauth=$oauthState, key-primary=$primaryState, key-secondary=$secondaryState" -ForegroundColor Green
