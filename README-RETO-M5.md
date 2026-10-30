# Entrega de Reto Práctico - Módulo 5 (QA Cloud-Native)

**Autor:** Carlos Lugo
**Repositorio:** [Tu URL de GitHub]

Este documento detalla la implementación y los comandos para ejecutar los entregables correspondientes al Reto Práctico del Módulo 5. El proyecto se construyó sobre la base del `servicio-tienda` (Node.js), añadiendo un framework E2E en Python y simulando un pipeline CI/CD completo.

---

## 🛠️ Requisitos de Instalación

Para ejecutar todas las fases, asegúrate de tener instalado:
*   **Node.js** (v18+)
*   **Python** (v3.9+)

Instala las dependencias de Node.js:
```powershell
npm install
Instala las dependencias de Python (crea y activa un entorno virtual):

powershell
python -m venv venv
.\venv\Scripts\activate
pip install playwright pytest pytest-bdd pytest-playwright
playwright install chromium
📂 Estructura del Proyecto (Enfocada al Reto)
1-generar-datos/: Fase 1 - Script de generación de datos con Faker.

4-pipeline/: Fase 2 - Archivo buildspec.yml y simulador de CI/CD.

e2e/: Fase 3 - Framework E2E con Playwright, Python, pytest-bdd y patrón Screenplay.

features/: Escenarios BDD (Gherkin).

steps/: Implementación de los pasos.

screenplay/: Patrón de diseño Screenplay (Actores y Tareas).

🚀 Guía de Ejecución por Fase
Fase 1: Datos de prueba realistas (10 PTS)
Entregable: Script generar-datos.js con semilla fija + db.json.
Ejecución:

powershell
npm run generar
Nota: El archivo db.json no está versionado en Git (ver .gitignore) porque el pipeline lo regenera en cada ejecución usando la semilla faker.seed(2025), garantizando datos deterministas sin ensuciar el repositorio.

Fase 2: Pipeline CI/CD y Quality Gates (15 PTS)
Entregable: Archivo buildspec.yml (emulando Azure/AWS) y ejecución local.
Ejecución:

powershell
npm run pipeline
Nota: El pipeline ejecuta las 4 fases (Install, Pre-Build, Build, Post-Build). Si los 186 tests de la API fallan, el pipeline se detiene con código de salida 1, bloqueando el despliegue.

Fase 3: Del caso manual al automatizado con IA (20 PTS)
Entregable: Carpeta e2e/ con features, steps y patrón Screenplay.
Ejecución:

Abre una terminal y levanta la API en segundo plano:

powershell
npm run api
Abre otra terminal, activa el entorno virtual de Python (.\venv\Scripts\activate) y ejecuta las pruebas BDD:

powershell
pytest e2e/ -v
Nota: Se implementaron 4 escenarios (Catálogo, Carrito, Pedidos, y un Caso de Borde). El caso de borde fue generado con IA (el prompt se encuentra documentado en el Documento de Soporte).

text

---

### 🚀 Guarda y sube a GitHub

Guarda el archivo (`Ctrl + K, S`) y ejecuta en tu terminal para que quede en tu repositorio:

```powershell
git add README-RETO-M5.md
git commit -m "docs: README exclusivo para la entrega del Reto M5"
git push origin main

### Fase 4, 5 y 6: Nube, Docker, Pact y Métricas
- **Docker:** `docker build -t servicio-tienda-img .` y `docker run -d -p 3001:3001 --name tienda-test servicio-tienda-img`
- **Pact (Contract Testing):** `npm run test:pact`
- **Métricas DORA y Pirámide:** Documentadas en el Documento de Soporte adjunto en la entrega.