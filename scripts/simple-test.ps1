param([string]$Action = "test")

Write-Host "WxDown Build Test Tool" -ForegroundColor Magenta
Write-Host "=====================" -ForegroundColor Magenta
Write-Host ""

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js not found" -ForegroundColor Red
    exit 1
}

# Check npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "npm not found" -ForegroundColor Red
    exit 1
}

# Check Git
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "Git: Available" -ForegroundColor Green
} else {
    Write-Host "Git not found" -ForegroundColor Red
}

# Check project files
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "Project: $($package.name) v$($package.version)" -ForegroundColor Green
} else {
    Write-Host "package.json not found" -ForegroundColor Red
    exit 1
}

if ($Action -eq "build") {
    Write-Host ""
    Write-Host "Starting build..." -ForegroundColor Blue
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build successful!" -ForegroundColor Green
    } else {
        Write-Host "Build failed!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Green
