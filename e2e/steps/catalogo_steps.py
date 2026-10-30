import pytest
from pytest_bdd import scenarios, given, when, then, parsers
from screenplay.actor import Actor, ConsultarProductos

# Cargar el feature
scenarios('../features/catalogo.feature')

@given("que abro la API de la tienda", target_fixture="actor")
def abrir_api(page):
    return Actor("Comprador QA", page)

@when("consulto la lista de productos")
def consultar_productos(actor):
    actor.attempts_to(ConsultarProductos())

@then(parsers.parse("debería ver al menos {cantidad:d} productos"))
def validar_cantidad(actor, cantidad):
    assert len(actor.resultado) >= cantidad, f"Se esperaban al menos {cantidad} productos, pero hay {len(actor.resultado)}"

@then("todos los productos deberían tener un precio mayor a cero")
def validar_precios(actor):
    for producto in actor.resultado:
        assert producto['precio'] > 0, f"El producto {producto['nombre']} tiene precio inválido"
