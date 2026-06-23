#Requires -Version 5.1
<#
.SYNOPSIS
  Stop Ada-SI native services started by start.ps1.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
$PidFile = Join-Path $Root '.ada-si.pids'

function Stop-PortListener([int]$Port) {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping $($proc.ProcessName) (PID $($proc.Id)) on port $Port"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Stopping Ada-SI services..."

if (Test-Path $PidFile) {
    Get-Content $PidFile | ForEach-Object {
        $procId = [int]$_.Trim()
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Stopping tracked process PID $procId ($($proc.ProcessName))"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item $PidFile -Force
}

foreach ($port in @(8080, 8090, 4000, 5173)) {
    Stop-PortListener -Port $port
}

Write-Host "Done."
