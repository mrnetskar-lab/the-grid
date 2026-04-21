param(
  [string]$SourceDir = "$env:USERPROFILE\Downloads",
  [string]$Pattern = "admin_notes_*.zip",
  [string]$InboxDir = "$env:USERPROFILE\Downloads\the-grid-inbox",
  [string]$LocalIncomingDir = "D:\V3\the_grid_exports\incoming-zips",
  [string]$CloudIncomingDir = "G:\My Drive\the-grid-backups\incoming-zips",
  [switch]$All
)

$ErrorActionPreference = 'Stop'

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Get-UniquePath {
  param(
    [string]$BaseDir,
    [string]$FileName
  )

  $candidate = Join-Path $BaseDir $FileName
  if (-not (Test-Path -LiteralPath $candidate)) {
    return $candidate
  }

  $name = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
  $ext = [System.IO.Path]::GetExtension($FileName)
  $i = 1
  while ($true) {
    $next = Join-Path $BaseDir ("{0}_{1}{2}" -f $name, $i, $ext)
    if (-not (Test-Path -LiteralPath $next)) {
      return $next
    }
    $i++
  }
}

function Copy-IfMissing {
  param(
    [string]$Source,
    [string]$TargetDir
  )

  Ensure-Dir -Path $TargetDir
  $name = [System.IO.Path]::GetFileName($Source)
  $target = Join-Path $TargetDir $name

  if (Test-Path -LiteralPath $target) {
    $srcLen = (Get-Item -LiteralPath $Source).Length
    $dstLen = (Get-Item -LiteralPath $target).Length
    if ($srcLen -eq $dstLen) {
      return @{ action = 'skipped'; path = $target }
    }
    $target = Get-UniquePath -BaseDir $TargetDir -FileName $name
  }

  Copy-Item -LiteralPath $Source -Destination $target -Force
  return @{ action = 'copied'; path = $target }
}

Ensure-Dir -Path $InboxDir
Ensure-Dir -Path $LocalIncomingDir
Ensure-Dir -Path $CloudIncomingDir

$today = Get-Date -Format 'yyyy-MM-dd'
$localDailyDir = Join-Path "D:\V3\the_grid_exports\release-bundles" $today
$cloudDailyDir = Join-Path "G:\My Drive\the-grid-backups\release-bundles" $today
Ensure-Dir -Path $localDailyDir
Ensure-Dir -Path $cloudDailyDir

$files = Get-ChildItem -LiteralPath $SourceDir -Filter $Pattern -File | Sort-Object LastWriteTime
if (-not $files -or $files.Count -eq 0) {
  Write-Host "No files matched '$Pattern' in $SourceDir"
  exit 1
}

if (-not $All) {
  $files = @($files[-1])
}

Write-Host ("Found {0} export file(s)." -f $files.Count)

$countMoved = 0
$countCopied = 0
$countSkipped = 0

foreach ($file in $files) {
  $workingPath = $file.FullName

  $inInbox = $workingPath.StartsWith($InboxDir, [System.StringComparison]::OrdinalIgnoreCase)
  if (-not $inInbox) {
    $inboxTarget = Get-UniquePath -BaseDir $InboxDir -FileName $file.Name
    Move-Item -LiteralPath $workingPath -Destination $inboxTarget
    $workingPath = $inboxTarget
    $countMoved++
    Write-Host ("Moved to inbox: {0}" -f $workingPath)
  }

  $targets = @($LocalIncomingDir, $CloudIncomingDir, $localDailyDir, $cloudDailyDir)
  foreach ($targetDir in $targets) {
    $result = Copy-IfMissing -Source $workingPath -TargetDir $targetDir
    if ($result.action -eq 'copied') {
      $countCopied++
      Write-Host ("Copied -> {0}" -f $result.path)
    } else {
      $countSkipped++
      Write-Host ("Skipped (already exists): {0}" -f $result.path)
    }
  }
}

Write-Host ''
Write-Host ("Done. moved={0}, copied={1}, skipped={2}" -f $countMoved, $countCopied, $countSkipped)
Write-Host "Tip: use -All to process every matching zip in Downloads."
