Param(
    [Parameter(Mandatory = $false)]
    [switch]$NoPause
)

$configPath = "$env:USERPROFILE\.config\opencode\opencode.json"

function Test-OpenCodeConfig {
    if (-not (Test-Path $configPath)) {
        Write-Host "[ERROR] opencode.json not found at $configPath" -ForegroundColor Red
        return $false
    }

    try {
        $content = Get-Content $configPath -Raw
        $json = $content | ConvertFrom-Json -ErrorAction Stop
        
        Write-Host "Checking for unrecognized keys..." -ForegroundColor Cyan
        
        # List of known valid top-level keys in opencode.json (v1.2.18 compatible)
        $validKeys = @(
            '$schema', 'plugin', 'model', 'agent', 'provider', 'mcp', 
            'rotationThreshold', 'safety-net', 'ui', 'server', 'experimental'
        )
        
        $invalidKeys = @()
        foreach ($key in $json.psobject.Properties.Name) {
            if ($key -notin $validKeys) {
                # Some versions might use PascalCase or camelCase
                if ($key.ToLower() -notin ($validKeys | ForEach-Object { $_.ToLower() })) {
                    $invalidKeys += $key
                }
            }
        }

        if ($invalidKeys.Count -gt 0) {
            Write-Host "[WARNING] Unrecognized keys found: $($invalidKeys -join ', ')" -ForegroundColor Yellow
            Write-Host "This might be from newer/experimental features or a typo." -ForegroundColor Gray
            # We don't necessarily want to exit 1 if they are just warnings
            return $true 
        }

        Write-Host "[OK] Configuration structure is valid." -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERROR] opencode.json is not a valid JSON file!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Gray
        return $false
    }
}

$isValid = Test-OpenCodeConfig
if (-not $isValid) {
    if (-not $NoPause) {
        Write-Host "`nPress Enter to exit..." -ForegroundColor Gray
        Read-Host
    }
    exit 1
}

if (-not $NoPause) {
    Write-Host "`nPress Enter to exit..." -ForegroundColor Gray
    Read-Host
}
exit 0
