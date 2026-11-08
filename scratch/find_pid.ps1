$target = "query_engine-windows.dll.node"
Get-Process node | ForEach-Object {
    $proc = $_
    try {
        $m = $proc.Modules | Where-Object { $_.FileName -like "*$target*" }
        if ($m) {
            Write-Output "LOCKING_PID:$($proc.Id)"
        }
    } catch {
        # ignore access denied
    }
}
