import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';

const provider = new PactV3({
  consumer: 'FrontendTienda',
  provider: 'ApiTienda',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Contrato API Productos', () => {
  it('Debe retornar una lista de productos', async () => {
    provider
      .given('Existen productos')
      .uponReceiving('Una petición GET para obtener productos')
      .withRequest({
        method: 'GET',
        path: '/productos',
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: MatchersV3.eachLike({
          id: MatchersV3.integer(1),
          nombre: MatchersV3.string('Elegant Steel Towels'),
          precio: MatchersV3.decimal(982.85),
        }),
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/productos`);
      const data = await response.json();
      expect(response.status).toBe(200);
     expect(Array.isArray(data)).toBe(true);
    });
  });
});