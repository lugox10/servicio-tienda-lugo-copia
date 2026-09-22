/**
 * runner-local.js — Simula el pipeline de AWS CodeBuild en tu maquina.
 *
 * Ejecuta las MISMAS 4 fases del buildspec.yml sin depender de PowerShell:
 *   INSTALL -> PRE_BUILD -> BUILD -> POST_BUILD
 *
 * Corre en Node.js puro (sin pwsh, sin bash), compatible con cualquier
 * Windows, Mac o Linux que tenga Node 20+.
 *
 * Uso:
 *   npm run pipeline         <- comando recomendado
 *   node 4-pipeline/runner-local.js
 *
 * El runner-local.ps1 sigue disponible si quieres correrlo directamente
 * desde una terminal PowerShell con colores extendidos:
 *   powershell -ExecutionPolicy Bypass -File 4-pipeline/runner-local.ps1
 */

import { spawn }       from 'node:child_process';
import { existsSync }  from 'node:fs';
import { readFileSync } from 'node:fs';
import path            from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');
const inicio = Date.now();

// ── Helpers de consola ────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
};
const cyan   = t => c.cyan   + t + c.reset;
const yellow = t => c.yellow + t + c.reset;
const green  = t => c.green  + t + c.reset;
const red    = t => c.red    + t + c.reset;
const gray   = t => c.gray   + t + c.reset;
const bold   = t => c.bold   + t + c.reset;

function titulo(texto) {
  console.log('');
  console.log(cyan('╔══════════════════════════════════════════════════════╗'));
  console.log(cyan('║  ' + texto.padEnd(52) + '║'));
  console.log(cyan('╚══════════════════════════════════════════════════════╝'));
}

function fase(nombre) {
  console.log('');
  console.log(yellow('── FASE: ' + nombre + ' ' + '─'.repeat(Math.max(0, 44 - nombre.length))));
}

function ok(msg)   { console.log(green('  ✓  ') + msg); }
function fail(msg) { console.log(red('  ✗  ') + msg); }
function info(msg) { console.log(gray('  →  ') + msg); }

// ── Ejecutar comando y esperar resultado ─────────────────────
function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd: opts.cwd || raiz,
      stdio: 'inherit',
      shell: true,
      ...opts
    });
    proc.on('close', code => resolve(code || 0));
    proc.on('error', () => resolve(1));
  });
}

// ── Iniciar servidor en background (sin bloquear) ────────────
function iniciarApi() {
  const proc = spawn('npx', ['json-server', '2-servicio/db.json', '--port', '3001'], {
    cwd: raiz,
    stdio: 'ignore',
    shell: true,
    detached: false
  });
  return proc;
}

// ── Healthcheck: esperar a que la API responda ────────────────
async function esperarApi(intentos = 8, esperaMs = 2000) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch('http://localhost:3001/productos');
      if (r.ok) return true;
    } catch { /* aun no lista */ }
    info(`Esperando API... intento ${i}/${intentos}`);
    await new Promise(r => setTimeout(r, esperaMs));
  }
  return false;
}

// ════════════════════════════════════════════════════════════
// PIPELINE
// ════════════════════════════════════════════════════════════
let apiProc = null;
let buildExitCode = 0;

titulo('PIPELINE LOCAL  |  Servicio Tienda  |  Dia 2');
info('Equivalente a: AWS CodeBuild corriendo buildspec.yml');
info('Carpeta del proyecto: ' + raiz);

// ── FASE 1: INSTALL ──────────────────────────────────────────
fase('INSTALL');
info('npm install...');
const installCode = await run('npm', ['install', '--silent']);
if (installCode !== 0) { fail('npm install fallo'); process.exit(1); }
ok('Dependencias instaladas');
ok('Node ' + process.version);

// ── FASE 2: PRE_BUILD ────────────────────────────────────────
fase('PRE_BUILD');

info('Restaurando dataset...');
const seedCode = await run('node', ['4-pipeline/restaurar-seed.js']);
if (seedCode !== 0) { fail('Restauracion fallo'); process.exit(1); }
ok('Dataset restaurado');

info('Levantando API en puerto 3001...');
apiProc = iniciarApi();
const apiOk = await esperarApi();

if (!apiOk) {
  fail('La API no responde en http://localhost:3001/productos');
  if (apiProc) apiProc.kill();
  process.exit(1);
}
ok('API responde en http://localhost:3001');

// ── FASE 3: BUILD ────────────────────────────────────────────
fase('BUILD  (corriendo tests)');

buildExitCode = await run('npm', ['test']);

// ── FASE 4: POST_BUILD ───────────────────────────────────────
fase('POST_BUILD');

info('Deteniendo API...');
if (apiProc) {
  apiProc.kill();
  ok('API detenida');
}

const reportePath = path.join(raiz, '4-pipeline', 'test-report.json');
if (existsSync(reportePath)) {
  const reporte = JSON.parse(readFileSync(reportePath, 'utf-8'));
  ok('Reporte disponible en 4-pipeline/test-report.json');
  info('  Pasaron : ' + reporte.pasadas);
  info('  Fallaron: ' + reporte.falladas);
  info('  Duracion: ' + reporte.duracionSegundos + 's');
} else {
  fail('No se genero 4-pipeline/test-report.json');
}

// ── RESULTADO FINAL ──────────────────────────────────────────
const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
console.log('');
console.log(cyan('══════════════════════════════════════════════════════'));
if (buildExitCode === 0) {
  console.log(green(bold('  ✓  BUILD PASSED  (' + duracion + 's)')));
  console.log(green('  En AWS: CodePipeline avanzaria a la siguiente etapa.'));
} else {
  console.log(red(bold('  ✗  BUILD FAILED  (' + duracion + 's)')));
  console.log(red('  En AWS: CodePipeline detendria el deploy y notificaria.'));
}
console.log(cyan('══════════════════════════════════════════════════════'));

process.exit(buildExitCode);
