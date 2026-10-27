param([string]$Executable = (Join-Path $PSScriptRoot '..\src-tauri\target\release\mochi-desktop.exe'))
$ErrorActionPreference = 'Stop'
$mochiExe = (Resolve-Path -LiteralPath $Executable).Path
$desktopDirectory = [Environment]::GetFolderPath('DesktopDirectory')
if (-not $desktopDirectory) { throw 'Windows did not return a Desktop folder.' }
$shortcutPath = Join-Path $desktopDirectory 'Mochi Start-Stop.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
if ((Test-Path -LiteralPath $shortcutPath) -and $shortcut.TargetPath -and
    ([IO.Path]::GetFileName($shortcut.TargetPath) -ne 'mochi-desktop.exe')) {
    throw 'A different shortcut already uses this name; it was left unchanged.'
}
$shortcut.TargetPath = $mochiExe
$shortcut.Arguments = '--toggle'
$shortcut.WorkingDirectory = Split-Path -Parent $mochiExe
$shortcut.IconLocation = "$mochiExe,0"
$shortcut.Description = 'Double-click to start Mochi, or stop the running companion cleanly.'
$shortcut.Save()
Write-Output "Created: $shortcutPath"
