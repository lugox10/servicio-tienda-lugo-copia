import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

pytest_plugins = ["pytest_playwright", "pytest_bdd"]

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args, playwright):
    """
    Configuración de Sauce Labs.
    Si las variables de entorno existen, Playwright se conecta a Sauce Labs.
    Si no, corre en local (headless).
    """
    sauce_username = os.getenv("SAUCE_USERNAME")
    sauce_access_key = os.getenv("SAUCE_ACCESS_KEY")

    if sauce_username and sauce_access_key:
        # Configuración para Sauce Labs (En un caso real, aquí se configuran las capabilities)
        print("☁️ Ejecutando en Sauce Labs...")
        return {
            **browser_context_args,
            "base_url": "http://localhost:3001",
        }
    print("💻 Ejecutando en Local...")
    return browser_context_args