Feature: Carrito y Pedidos

  Scenario: Agregar un producto al carrito
    Given que abro la API de la tienda
    When creo un pedido para el producto 1
    Then el pedido debería crearse exitosamente

  Scenario: Consultar la lista de pedidos
    Given que abro la API de la tienda
    When consulto la lista de pedidos
    Then debería ver al menos 1 pedido registrado

  Scenario: Intentar crear un pedido sin cliente (Caso de borde generado por IA)
    Given que abro la API de la tienda
    When intento crear un pedido sin enviar el campo cliente
    Then la API debería responder con un error de validación
