# PowerShell script to kill process on port 5000
# Usage: .\kill-port.ps1 [port]

param(
    [int]$Port = 5000
)

Write-Host "Finding process on port $Port..."

$process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Found process $process on port $Port"
    Stop-Process -Id $process -Force
    Write-Host "Process $process killed successfully"
} else {
    Write-Host "No process found on port $Port"
}

