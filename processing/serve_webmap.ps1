theparam(
    [string]$Root = "d:\Andre\Cartography\RR\ddrr",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

function Get-ContentType {
    param([string]$Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { "text/html; charset=utf-8"; break }
        ".css" { "text/css; charset=utf-8"; break }
        ".js" { "application/javascript; charset=utf-8"; break }
        ".json" { "application/json; charset=utf-8"; break }
        ".geojson" { "application/geo+json; charset=utf-8"; break }
        ".svg" { "image/svg+xml"; break }
        ".png" { "image/png"; break }
        ".jpg" { "image/jpeg"; break }
        ".jpeg" { "image/jpeg"; break }
        ".gif" { "image/gif"; break }
        ".ico" { "image/x-icon"; break }
        default { "application/octet-stream"; break }
    }
}

$rootFull = [System.IO.Path]::GetFullPath($Root)
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Output "Serving $rootFull at http://localhost:$Port/"

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        $requestPath = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq "/") {
            $requestPath = "/index.html"
        }

        $relative = $requestPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $rootFull $relative))

        if (-not $candidatePath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            $res.StatusCode = 403
            $res.Close()
            continue
        }

        if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
            $res.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found")
            $res.ContentType = "text/plain; charset=utf-8"
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
            continue
        }

        $fileBytes = [System.IO.File]::ReadAllBytes($candidatePath)
        $res.StatusCode = 200
        $res.ContentType = Get-ContentType -Path $candidatePath
        $res.ContentLength64 = $fileBytes.Length
        $res.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        $res.Close()
    }
    catch {
        try { $res.Close() } catch {}
    }
}
