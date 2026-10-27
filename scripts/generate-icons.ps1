$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$target = Join-Path $PSScriptRoot '../src-tauri/icons'
[System.IO.Directory]::CreateDirectory($target) | Out-Null
function Write-MochiIcon([int]$size, [string]$path) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.ScaleTransform($size / 256.0, $size / 256.0)
  $ink = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#51435f'), 4)
  $hood = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#bdb0df'))
  $face = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#ffe7db'))
  $hair = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#fbefd9'))
  $eyes = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#6d5b82'))
  $pink = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#eea9aa'))
  $g.FillEllipse($hood, 26, 19, 52, 77); $g.DrawEllipse($ink, 26, 19, 52, 77)
  $g.FillEllipse($hood, 178, 19, 52, 77); $g.DrawEllipse($ink, 178, 19, 52, 77)
  $g.FillEllipse($hood, 17, 37, 222, 207); $g.DrawEllipse($ink, 17, 37, 222, 207)
  $g.FillEllipse($face, 39, 65, 178, 156); $g.DrawEllipse($ink, 39, 65, 178, 156)
  $g.FillEllipse($hair, 36, 48, 184, 89)
  $g.FillEllipse($hair, 43, 82, 55, 77); $g.FillEllipse($hair, 93, 75, 52, 68); $g.FillEllipse($hair, 149, 82, 55, 60)
  $g.FillEllipse($eyes, 77, 142, 26, 43); $g.FillEllipse($eyes, 153, 142, 26, 43)
  $g.FillEllipse([System.Drawing.Brushes]::White, 81, 147, 9, 12); $g.FillEllipse([System.Drawing.Brushes]::White, 157, 147, 9, 12)
  $g.FillEllipse($pink, 60, 184, 32, 13); $g.FillEllipse($pink, 164, 184, 32, 13)
  $g.DrawArc($ink, 116, 183, 24, 16, 0, 180)
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bitmap.Dispose(); $ink.Dispose(); $hood.Dispose(); $face.Dispose(); $hair.Dispose(); $eyes.Dispose(); $pink.Dispose()
}
Write-MochiIcon 32 (Join-Path $target '32x32.png')
Write-MochiIcon 128 (Join-Path $target '128x128.png')
Write-MochiIcon 256 (Join-Path $target '256x256.png')
$png = [System.IO.File]::ReadAllBytes((Join-Path $target '256x256.png'))
$stream = [System.IO.File]::Create((Join-Path $target 'icon.ico'))
$writer = New-Object System.IO.BinaryWriter($stream)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
$writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
$writer.Write([uint16]1); $writer.Write([uint16]32); $writer.Write([uint32]$png.Length); $writer.Write([uint32]22); $writer.Write($png)
$writer.Dispose(); $stream.Dispose()
Write-Output 'Created original Mochi PNG and ICO assets.'
