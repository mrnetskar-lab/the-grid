<#
Move repo contents into an `archive` folder (excludes .git)
Usage (PowerShell):
  cd <repo-root>
  pwsh ./scripts/move_to_archive.ps1
or:
  ./scripts/move_to_archive.ps1 -ArchiveName archive-2026-04-20
#>
param(
  [string]$ArchiveName = 'archive'
)

$root = (Get-Location).ProviderPath
$archive = Join-Path $root $ArchiveName
if (-not (Test-Path -LiteralPath $archive)) {
  New-Item -ItemType Directory -Path $archive -Force | Out-Null
}

Get-ChildItem -LiteralPath $root -Force | Where-Object {
  $_.Name -ne '.git' -and $_.Name -ne $ArchiveName
} | ForEach-Object {
  $src = $_.FullName
  $dst = Join-Path $archive $_.Name
  try {
    Move-Item -LiteralPath $src -Destination $dst -Force -ErrorAction Stop
    Write-Output "Moved: $($_.Name)"
  } catch {
    Write-Warning "Failed to move $($_.Name): $($_.Exception.Message)"
  }
}

Write-Output "Finished. Check: $archive"
