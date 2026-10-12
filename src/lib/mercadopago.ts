import 'server-only';

import { MercadoPagoConfig, Order } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no está definida en las variables de entorno.');
}

// Configuración global y credenciales para autenticar las peticiones a la API de Mercado Pago.
const mpConfig = new MercadoPagoConfig({
    accessToken: ACCESS_TOKEN,
});

// - order: Para crear y gestionar las órdenes de compra.
export const order = new Order(mpConfig);
