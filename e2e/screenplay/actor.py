class Actor:
    def __init__(self, name, page):
        self.name = name
        self.page = page
        self.resultado = None

    def attempts_to(self, *tasks):
        for task in tasks:
            task.perform_as(self)
        return self

class ConsultarProductos:
    def perform_as(self, actor):
        response = actor.page.request.get('http://localhost:3001/productos')
        actor.resultado = response.json()

class CrearPedido:
    def __init__(self, producto_id, cliente):
        self.producto_id = producto_id
        self.cliente = cliente

    def perform_as(self, actor):
        payload = {
            'productoId': self.producto_id,
            'cliente': self.cliente,
            'cantidad': 1,
            'estado': 'pendiente',
            'fecha': '2024-10-29'
        }
        response = actor.page.request.post('http://localhost:3001/pedidos', data=payload)
        actor.resultado = response
