# Bumps the ?v= version on every CSS/JS link (Windows PowerShell).
# Usage (from the project root):  powershell -ExecutionPolicy Bypass -File scripts/clean-cache.ps1
$root = Split-Path -Parent $PSScriptRoot
$v = Get-Date -Format "yyyyMMddHHmm"
Get-ChildItem -Path $root -Filter *.html | ForEach-Object {
  $c = [IO.File]::ReadAllText($_.FullName)
  $c = [regex]::Replace($c, '(\.(css|js))(\?v=[0-9A-Za-z]+)?"', ('$1?v=' + $v + '"'))
  [IO.File]::WriteAllText($_.FullName, $c, (New-Object System.Text.UTF8Encoding $false))
}
Write-Host "Cache version set to v=$v"
Write-Host "If the site still looks old: hPanel > Advanced > Cache Manager > Purge all."
