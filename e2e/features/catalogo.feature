Feature: Catálogo de la Tienda
  Como comprador
  Quiero ver los productos disponibles
  Para poder decidir qué comprar

  Scenario: Ver el catálogo inicial de productos
    Given que abro la API de la tienda
    When consulto la lista de productos
    Then debería ver al menos 5 productos
    And todos los productos deberían tener un precio mayor a cero