# ============================================================
# runner-local.ps1 - ALTERNATIVA PowerShell del pipeline local.
#
# El pipeline OFICIAL es Node: "npm run pipeline" (runner-local.js).
# Este .ps1 es opcional, para quien prefiera correrlo en PowerShell
# con colores nativos. Ejecuta las MISMAS 4 fases del buildspec.yml:
#   INSTALL -> PRE_BUILD -> BUILD -> POST_BUILD
#
# Uso (desde la carpeta servicio-tienda). Elige la forma que funcione
# en tu maquina segun el ejecutable de PowerShell que tengas:
#   powershell -ExecutionPolicy Bypass -File pipeline/runner-local.ps1   (Windows PowerShell 5.x)
#   pwsh       -File pipeline/runner-local.ps1                            (PowerShell 7+ si esta en el PATH)
#
# NOTA: "pwsh" solo existe si instalaste PowerShell 7+. En un Windows
# estandar el ejecutable es "powershell". Por eso el pipeline oficial
# usa Node: funciona igual en cualquier maquina sin depender de esto.
# ============================================================

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$inicio = Get-Date
$apiJob = $null

function Titulo($texto) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host ("║  " + $texto.PadRight(52) + "║") -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Fase($nombre) {
    Write-Host ""
    Write-Host ("── FASE: " + $nombre + " " + ("─" * (44 - $nombre.Length))) -ForegroundColor Yellow
}

function OK($msg)   { Write-Host ("  ✓  " + $msg) -ForegroundColor Green }
function FAIL($msg) { Write-Host ("  ✗  " + $msg) -ForegroundColor Red }
function INFO($msg) { Write-Host ("  →  " + $msg) -ForegroundColor Gray }

# ── INICIO ───────────────────────────────────────────────────
Titulo "PIPELINE LOCAL  |  Servicio Tienda  |  Dia 2"
INFO "Equivalente a: AWS CodeBuild corriendo buildspec.yml"
INFO "Carpeta del proyecto: $raiz"

Set-Location $raiz

# ── FASE 1: INSTALL ──────────────────────────────────────────
Fase "INSTALL"
INFO "Instalando dependencias (npm install)..."
npm install --silent
if ($LASTEXITCODE -ne 0) { FAIL "npm install fallo"; exit 1 }
OK "Dependencias instaladas"
$nodeVer = node --version
$npmVer  = npm --version
OK "Node $nodeVer  |  npm $npmVer"

# ── FASE 2: PRE_BUILD ────────────────────────────────────────
Fase "PRE_BUILD"

INFO "Restaurando dataset al estado original..."
node pipeline/restaurar-seed.js
if ($LASTEXITCODE -ne 0) { FAIL "Restauracion fallo"; exit 1 }
OK "Dataset restaurado"

INFO "Levantando API en puerto 3001 (proceso en background)..."
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:raiz
    npx json-server db.json --port 3001 2>&1
}
Start-Sleep -Seconds 4

# Verificar que la API responde
INFO "Comprobando que la API responde..."
$apiOk = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:3001/productos" -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) { $apiOk = $true; break }
    } catch { Start-Sleep -Seconds 2 }
}

if (-not $apiOk) {
    FAIL "La API no responde en http://localhost:3001/productos"
    if ($apiJob) { Stop-Job $apiJob; Remove-Job $apiJob }
    exit 1
}
OK "API responde en http://localhost:3001"

# ── FASE 3: BUILD ────────────────────────────────────────────
Fase "BUILD  (corriendo tests)"

$buildExitCode = 0
try {
    npm test
    $buildExitCode = $LASTEXITCODE
} catch {
    $buildExitCode = 1
}

# ── FASE 4: POST_BUILD ───────────────────────────────────────
Fase "POST_BUILD"

INFO "Deteniendo API..."
if ($apiJob) {
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
}

# Matar cualquier proceso json-server que siga en 3001
$proc = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
if ($proc) {
    Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    OK "Puerto 3001 liberado"
}

$reportePath = Join-Path $raiz "pipeline/test-report.json"
if (Test-Path $reportePath) {
    OK "Reporte disponible en pipeline/test-report.json"
    $reporte = Get-Content $reportePath | ConvertFrom-Json
    INFO ("  Pasaron : " + $reporte.pasadas)
    INFO ("  Fallaron: " + $reporte.falladas)
    INFO ("  Duracion: " + $reporte.duracionSegundos + "s")
} else {
    FAIL "No se encontro el reporte de tests"
}

# ── RESULTADO FINAL ──────────────────────────────────────────
$duracion = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 2)
Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($buildExitCode -eq 0) {
    Write-Host "  ✓  BUILD PASSED  ($duracion s)" -ForegroundColor Green
    Write-Host "  En AWS: CodePipeline avanzaria a la siguiente etapa." -ForegroundColor Green
} else {
    Write-Host "  ✗  BUILD FAILED  ($duracion s)" -ForegroundColor Red
    Write-Host "  En AWS: CodePipeline detendria el deploy y notificaria." -ForegroundColor Red
}
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan

exit $buildExitCode
