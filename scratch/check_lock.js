const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Finding process locking query_engine ---');
const psScript = `
Get-Process node | ForEach-Object {
  $proc = $_
  try {
    $modules = $proc.Modules | Where-Object { $_.FileName -like '*query_engine-windows.dll.node*' }
    if ($modules) {
      Write-Host "FOUND_PID: $($proc.Id) $($proc.ProcessName)"
    }
  } catch {
  }
}
`;

try {
  const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
  console.log(result);
} catch (e) {
  console.log('Error searching modules:', e.message);
}

