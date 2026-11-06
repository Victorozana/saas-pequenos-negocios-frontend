param(
    [string]$BackendPath = (Join-Path $PSScriptRoot '../../saas-pequenos-negocios-backend'),
    [switch]$BrowserOnly
)

$ErrorActionPreference = 'Stop'
$frontend = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backend = (Resolve-Path $BackendPath).Path
$backendUrl = 'http://localhost:5075'
$frontendUrl = 'http://localhost:3075'
$scratch = New-Item -ItemType Directory -Path (Join-Path ([IO.Path]::GetTempPath()) ('nexo-regression-' + [Guid]::NewGuid().ToString('N')))
$pickup = New-Item -ItemType Directory -Path (Join-Path $scratch.FullName 'pickup')
$processes = @()

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command falhou com código $LASTEXITCODE." }
}

function Start-TestService {
    param([string]$Name, [string]$Command, [string[]]$Arguments, [string]$Directory)
    $parameters = @{
        FilePath = $Command
        ArgumentList = $Arguments
        WorkingDirectory = $Directory
        RedirectStandardOutput = (Join-Path $scratch.FullName "$Name.stdout.log")
        RedirectStandardError = (Join-Path $scratch.FullName "$Name.stderr.log")
        PassThru = $true
    }
    if ($IsWindows) { $parameters.WindowStyle = 'Hidden' }
    Start-Process @parameters
}

function Wait-Ready {
    param([string]$Url, $Process)
    for ($attempt = 0; $attempt -lt 120; $attempt++) {
        if ($Process.HasExited) { throw "Serviço encerrou antes de responder. Logs em $($scratch.FullName)." }
        try { Invoke-WebRequest -Uri $Url -TimeoutSec 2 -ErrorAction Stop | Out-Null; return }
        catch { Start-Sleep -Seconds 1 }
    }
    throw "Serviço de teste não respondeu em $Url. Logs em $($scratch.FullName)."
}

$environment = @{
    ASPNETCORE_ENVIRONMENT = 'Development'
    ASPNETCORE_URLS = $backendUrl
    Database__RequirePostgreSql = $(if ($env:E2E_USE_POSTGRES -eq 'true') { 'true' } else { 'false' })
    DevelopmentSeed__Password = [Guid]::NewGuid().ToString('N')
    Notifications__Email__Provider = 'Pickup'
    Notifications__Email__From = 'nexo-test@example.test'
    Notifications__Email__PickupDirectory = $pickup.FullName
    API_BASE_URL = $backendUrl
    E2E_BACKEND_URL = $backendUrl
    E2E_FRONTEND_URL = $frontendUrl
    E2E_PICKUP_DIRECTORY = $pickup.FullName
}
$environment.E2E_ADMIN_PASSWORD = $environment.DevelopmentSeed__Password
$previous = @{}
foreach ($name in $environment.Keys) {
    $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
try {
    Write-Host "Frontend $(git -C $frontend rev-parse HEAD) | Backend $(git -C $backend rev-parse HEAD)"
    if (!$BrowserOnly) {
        Push-Location $backend
        try { Invoke-Checked 'dotnet' @('test', 'Agendamento.sln', '--nologo', '-v', 'q') } finally { Pop-Location }
        Push-Location $frontend
        try { Invoke-Checked 'npm' @('test') } finally { Pop-Location }
    }

    foreach ($name in $environment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $environment[$name], 'Process')
    }

    Push-Location $backend
    $apiOutput = Join-Path $scratch.FullName 'api'
    try { Invoke-Checked 'dotnet' @('build', 'src/Agendamento.Api', '--output', $apiOutput, '--nologo', '-v', 'q') } finally { Pop-Location }
    Push-Location $frontend
    try { Invoke-Checked 'npm' @('run', 'build') } finally { Pop-Location }

    $apiDirectory = Join-Path $backend 'src/Agendamento.Api'
    $api = Start-TestService 'api' 'dotnet' @('"' + (Join-Path $apiOutput 'Agendamento.Api.dll') + '"') $apiDirectory
    $processes += $api
    Wait-Ready "$backendUrl/health" $api
    $web = Start-TestService 'web' 'node' @('node_modules/next/dist/bin/next', 'start', '-p', '3075') $frontend
    $processes += $web
    Wait-Ready "$frontendUrl/login" $web
    Write-Host "API de teste $backendUrl (PID $($api.Id)) e frontend $frontendUrl (PID $($web.Id))."

    Push-Location $frontend
    try { Invoke-Checked 'node' @('node_modules/@playwright/test/cli.js', 'test') } finally { Pop-Location }
}
finally {
    foreach ($process in $processes) { if (!$process.HasExited) { Stop-Process -Id $process.Id } }
    foreach ($name in $previous.Keys) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
    foreach ($file in $pickup.GetFiles('*.eml')) { $file.Delete() }
    $pickup.Delete()
}
