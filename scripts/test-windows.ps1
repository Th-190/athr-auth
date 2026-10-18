$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$temporaryBootstrap = Join-Path $env:TEMP "karbala-phpunit-bootstrap-$PID.php"

try {
    Set-Content -LiteralPath $temporaryBootstrap -Value '<?php' -NoNewline
    Push-Location $projectRoot
    try {
        & php vendor/bin/pest --configuration=phpunit.xml --bootstrap=$temporaryBootstrap @args
        exit $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-Item -LiteralPath $temporaryBootstrap -ErrorAction SilentlyContinue
}
