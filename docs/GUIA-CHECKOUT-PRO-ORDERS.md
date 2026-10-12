# Implementación: Checkout Pro + Orders API

Con esta forma, **el comprador sale de nuestro sitio y paga en Mercado Pago**, donde elige el medio de pago e ingresa sus datos. Nuestro backend usa **Orders API** para crear la orden y obtener la URL del checkout; no necesitamos un formulario de tarjeta propio.

Vamos a crear la orden, configurar las URLs de retorno, redirigir al comprador y consultar el resultado cuando vuelva. Es una práctica, no una tienda lista para producción.

## 1. Preparar el backend

Antes de enviar al comprador a Mercado Pago, nuestro servidor tiene que crear una orden para obtener la URL de pago. Primero prepararemos el cliente que hará esa solicitud.

Necesitamos el **Access Token** de nuestra aplicación, disponible en el panel de desarrolladores. Lo guardamos como `MP_ACCESS_TOKEN` y usamos el paquete `mercadopago`, el SDK de Node.js, para configurar las llamadas:

```ts
import 'server-only';
import { MercadoPagoConfig, Order } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!ACCESS_TOKEN) throw new Error('Falta MP_ACCESS_TOKEN');

const mpConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
export const order = new Order(mpConfig);
```

`MercadoPagoConfig` configura las credenciales y `Order` ofrece los métodos para crear y consultar órdenes. Prepararlo no crea una compra ni cobra. `server-only` impide importar esta configuración desde código cliente.

**Esta redirección no necesita Payment Brick, Public Key ni `initMercadoPago` en el frontend.** Los datos de pago se capturan en Mercado Pago. Tampoco creamos una preferencia: usamos Orders, no Preferences API.

Ver [crear orden de Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/create-order).

## 2. Solicitar la orden desde el frontend

Con el cliente del backend preparado, agregamos un botón para iniciar la compra. Al pulsarlo, enviamos el carrito a nuestra ruta; ella creará la orden y devolverá la URL de pago. La función `handleCheckout` llama al servicio:

```ts
const order = await createCheckoutProOrder({ items });
```

El servicio hace `POST /api/checkout-pro/orders` con IDs de productos y cantidades. **No mandamos un precio definitivo, token ni medio de pago:** el servidor calcula el total y el comprador elige cómo pagar después.

La respuesta de nuestra ruta es `{ id, checkout_url }`. Mientras carga deshabilitamos el botón; si falla mostramos un error. Más adelante veremos cómo identificar la operación para evitar duplicados al reintentar; deshabilitar el botón no alcanza.

## 3. Crear la orden

Ahora nuestra ruta recibe la compra y debe convertirla al formato de Orders API. Validaremos el importe, armaremos el cuerpo y llamaremos a `order.create`.

Checkout Pro requiere **`processing_mode: 'manual'`**: la orden se crea antes de que el comprador complete el checkout. No implica aprobación humana ni llamar al endpoint de procesamiento manual de Checkout API; el flujo de Checkout Pro continúa el pago.

Validamos el carrito, calculamos el total con precios del servidor y usamos `mapCheckoutProToOrder` para preparar:

| Campo | Qué enviamos |
| --- | --- |
| `type` | `'online'` |
| `processing_mode` | `'manual'` |
| `total_amount` | Total como texto con dos decimales. |
| `external_reference` | Referencia propia; en esta práctica, un UUID. |
| `items` | `external_code`, `title`, `quantity` y `unit_price`. |
| `config.online` | URLs de retorno y regreso automático. |

La suma de los productos debe coincidir con `total_amount`. A diferencia de Checkout API con tarjeta, no enviamos `transactions.payments` con un token. Guardamos el objeto preparado por el mapper en `body`.

Antes de enviarlo agregamos una **clave de idempotencia**: un identificador que permite reconocer un reintento de la misma operación y evitar crear otra orden. En este ejemplo la generamos con `crypto.randomUUID()` y la pasamos en `requestOptions.idempotencyKey`; el SDK la envía en el encabezado `X-Idempotency-Key`, requerido por Orders API.

```ts
const orderCreated = await order.create({
    body,
    requestOptions: { idempotencyKey: crypto.randomUUID() },
});

return NextResponse.json({
    id: orderCreated.id,
    checkout_url: orderCreated.checkout_url,
});
```

**Una operación nueva lleva una clave nueva; un reintento de la misma operación debe reutilizarla.** Nuestro ejemplo genera otra en cada POST, así que no cubre reintentos entre solicitudes diferentes. Para cubrirlos habría que conservar la clave y volver a enviarla.

Ante `MercadoPagoError` devolvemos su estado y mensaje; ante otro error, `500`. **Crear la orden todavía no significa que esté pagada.**

Ver [referencia del endpoint](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro/create-order/post).

## 4. Configurar las URLs de retorno

Al crear la orden también debemos indicar adónde volverá el comprador tras pagar o cancelar. Primero construimos la dirección completa de nuestra página de resultado:

```ts
const returnUrl = new URL('/order-status', process.env.APP_URL ?? request.nextUrl.origin).toString();
```

Usamos `APP_URL` como base o, si no está definida, el origen de la petición. En producción debe apuntar al dominio público HTTPS. Pasamos `returnUrl` al mapper, que la recibe dentro de `orderData` y configura los destinos en `config.online`:

```ts
config: {
    online: {
        success_url: orderData.returnUrl,
        failure_url: orderData.returnUrl,
        pending_url: orderData.returnUrl,
        auto_return: 'approved',
    },
},
```

| Opción | Función |
| --- | --- |
| `success_url` | Regreso tras un aprobado. |
| `failure_url` | Regreso tras rechazo o cancelación. En nuestra prueba también se usó al volver sin pagar. |
| `pending_url` | Regreso con pago pendiente. |
| `auto_return: 'approved'` | Regreso automático para aprobados; no es otra URL. |

Las tres apuntan a `/order-status`. Esa página consulta la orden: no confía en la URL de regreso como prueba del cobro. La documentación también admite `auto_return: 'all'`; ambas opciones requieren `success_url`.

**Cambiar las URLs requiere crear una orden nueva:** un checkout anterior conserva su configuración.

Ver [URLs y parámetros de retorno](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/web-integration/configure-back-urls?scope=prod).

## 5. Redirigir a Mercado Pago

Con la respuesta del backend ya tenemos `checkout_url`. Ahora llevamos al comprador a esa dirección para que elija el medio de pago y complete la compra:

```ts
window.location.href = order.checkout_url;
```

Es una navegación hacia un sitio externo, no entre rutas de Next.js. **`checkout_url` es adónde se paga; `config.online` define adónde se vuelve.**

## 6. Distinguir volver sin pagar de un resultado

Al regresar necesitamos distinguir si el comprador volvió sin pagar o si hay un resultado para consultar. El primero vuelve a las opciones; para el segundo consultamos la orden en el servidor.

En nuestra prueba, «Volver a la tienda» utilizó `failure_url` con `payment_id=null` y `status=null`. Es un comportamiento observado; la documentación no describe explícitamente ese enlace.

Mercado Pago agrega esos parámetros a la URL de regreso. En `/order-status` los leemos desde `searchParams` como `paymentId` y `status`; aquí `'null'` es texto de la URL, no el valor `null` de JavaScript. Con ellos distinguimos ese caso:

```ts
if (paymentId === 'null' && status === 'null') {
    redirect('/options');
}
```

Así, volver sin pagar lleva a las opciones; un resultado continúa en la página de estado. No usamos simplemente la ausencia de `order_id` para decidir. Estos parámetros orientan la navegación, **no confirman el cobro ni cancelan la orden**.

Si vuelve con `order_id`, consultamos `order.get({ id: orderId })` desde el servidor. No lo reemplazamos por `payment_id`. Si falta el ID o falla la consulta mostramos un aviso; no poder consultar no equivale a pago rechazado.

La pantalla compartida muestra el aprobado para `status: 'processed'` y `status_detail: 'accredited'`, con importe, medio de pago, cuotas, fecha y referencia. Distingue pagos en proceso, intentos fallidos y errores de consulta; para otros estados muestra un aviso de respaldo. Ver el [manejo del resultado](GUIA-CHECKOUT-API-ORDERS.md#6-consultar-el-resultado).

**El comprador puede pagar y cerrar la pestaña sin volver.** Las URLs no sustituyen los webhooks, notificaciones que Mercado Pago envía directamente a nuestro backend. Quedan fuera de la práctica. Ver [obtener orden](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro/get-order/get).

## 7. Probar sin dinero real

Antes de confirmar un pago, comprobamos que tanto las credenciales como el comprador y la tarjeta sean de prueba. Abrir el checkout en incógnito no alcanza.

El [procedimiento oficial](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/integration-test-introduction) indica usar:

1. Credenciales de prueba del vendedor.
2. `payer.email` del comprador de prueba al crear la orden.
3. Sesión del comprador de prueba en Mercado Pago.
4. Tarjetas de prueba y consulta con el Access Token de prueba.

**Nuestro mapper todavía no envía `payer.email`**; falta agregarlo para seguir ese procedimiento completo. Iniciar sesión como comprador de prueba no incorpora ese campo a la orden.

Incógnito es opcional para no reutilizar la cuenta personal; **no convierte una operación real en prueba**.

Está implementado el recorrido de creación, redirección y consulta. Comprobamos que volver sin pagar lleva a las opciones; aprobado, rechazado y pendiente de Checkout Pro deben verificarse por separado. No incluimos persistencia, permisos, webhooks ni reintentos completos. Ver [alcance general](../GUIA.md).
