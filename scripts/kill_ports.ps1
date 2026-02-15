$ports = @(8004,8005,8006)
foreach ($port in $ports) {
  Write-Output "--- Checking port $port ---"
  $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  if ($pids) {
    foreach ($procId in $pids) {
      Write-Output ("Found PID: {0} for port {1}" -f $procId, $port)
      try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Output ("Killed PID {0}" -f $procId)
      } catch {
        Write-Output ("Failed to kill PID {0}: {1}" -f $procId, $_.Exception.Message)
      }
    }
  } else {
    Write-Output "No process found on port $port"
  }
}
