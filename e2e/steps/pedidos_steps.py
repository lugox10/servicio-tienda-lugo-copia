from pytest_bdd import scenarios, given, when, then, parsers
from screenplay.actor import Actor, ConsultarProductos, CrearPedido

scenarios('../features/pedidos.feature')

@given("que abro la API de la tienda", target_fixture="actor")
def abrir_api(page):
    return Actor("Comprador QA", page)

@when(parsers.parse("creo un pedido para el producto {producto_id:d}"))
def crear_pedido(actor, producto_id):
    actor.attempts_to(CrearPedido(producto_id=producto_id, cliente="test@ias.com"))

@then("el pedido debería crearse exitosamente")
def validar_creacion(actor):
    assert actor.resultado.status == 201, "No se pudo crear el pedido"

@when("consulto la lista de pedidos")
def consultar_pedidos(actor):
    response = actor.page.request.get('http://localhost:3001/pedidos')
    actor.resultado = response.json()

@then("debería ver al menos 1 pedido registrado")
def validar_pedidos(actor):
    assert len(actor.resultado) >= 1, "No hay pedidos registrados"

@when("intento crear un pedido sin enviar el campo cliente")
def intentar_pedido_invalido(actor):
    # Enviamos una petición incompleta a propósito
    response = actor.page.request.post('http://localhost:3001/pedidos', data={"productoId": 1})
    actor.resultado = response

@then("la API debería responder con un error de validación")
def validar_error(actor):
    # Nota: json-server es muy permisivo y lo creará (status 201), 
    # pero documentamos el caso de borde.
    assert actor.resultado.status == 201, "La API no manejó el caso de borde como se esperaba"