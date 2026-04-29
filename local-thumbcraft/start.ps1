$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Kill any process already holding port 5000 (prevents EADDRINUSE crash)
$stale = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($stale) {
    Write-Host "Stopping stale process on port 5000 (PID $stale)..."
    Stop-Process -Id $stale -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Launch backend
Start-Process powershell `
    -WorkingDirectory "$root\backend" `
    -ArgumentList "-NoExit", "-Command", "node server.js"

# Launch frontend
Start-Process powershell `
    -WorkingDirectory "$root\frontend" `
    -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "✅ Backend  → http://localhost:5000"
Write-Host "✅ Frontend → http://localhost:5173"
