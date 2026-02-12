param([Parameter(Mandatory = $true)][string]$docx)

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-MimeType([string]$name) {
  $ext = [System.IO.Path]::GetExtension($name).ToLowerInvariant()
  switch ($ext) {
    ".png" { return "image/png" }
    ".webp" { return "image/webp" }
    ".gif" { return "image/gif" }
    ".bmp" { return "image/bmp" }
    ".svg" { return "image/svg+xml" }
    default { return "image/jpeg" }
  }
}

$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $docx))
try {
  $docEntry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" } | Select-Object -First 1
  if (-not $docEntry) {
    throw "word/document.xml not found"
  }

  $reader = New-Object System.IO.StreamReader($docEntry.Open())
  try { $xmlText = $reader.ReadToEnd() } finally { $reader.Close() }

  [xml]$xml = $xmlText
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

  $paragraphs = @()
  foreach ($p in $xml.SelectNodes("//w:body/w:p", $ns)) {
    $texts = @($p.SelectNodes(".//w:t", $ns) | ForEach-Object { $_."#text" })
    $line = (($texts -join "") -replace "\s+", " ").Trim()
    if ($line) { $paragraphs += $line }
  }

  $images = @()
  foreach ($entry in $zip.Entries | Where-Object { $_.FullName -like "word/media/*" }) {
    $stream = $entry.Open()
    try {
      $ms = New-Object System.IO.MemoryStream
      try {
        $stream.CopyTo($ms)
        $bytes = $ms.ToArray()
      } finally {
        $ms.Dispose()
      }
    } finally {
      $stream.Dispose()
    }

    if ($bytes.Length -eq 0) { continue }
    $mime = Get-MimeType $entry.Name
    $b64 = [Convert]::ToBase64String($bytes)
    $images += "data:$mime;base64,$b64"
  }

  [PSCustomObject]@{
    file = [System.IO.Path]::GetFileName($docx)
    paragraphs = $paragraphs
    images = $images
  } | ConvertTo-Json -Depth 6 -Compress
} finally {
  $zip.Dispose()
}
