# Implementación: Checkout API + Orders API

Con esta forma, **el comprador paga en nuestro sitio** usando Payment Brick, un formulario ya armado por Mercado Pago. El Brick recoge los datos y tokeniza la tarjeta; nuestro backend usa **Orders API** para solicitar el pago.

Vamos a inicializar el SDK, configurar el Brick, enviar sus datos al backend y consultar el resultado de la orden. Seguimos una tarjeta de prueba aprobada, no todos los casos de producción.

## 1. Preparar el frontend

Para mostrar el formulario seguro en nuestro sitio, primero configuramos la biblioteca del navegador. Necesitamos la **Public Key** de nuestra aplicación, disponible en el panel de desarrolladores, y el SDK `@mercadopago/sdk-react`:

```tsx
import { initMercadoPago } from '@mercadopago/sdk-react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

if (PUBLIC_KEY) {
    initMercadoPago(PUBLIC_KEY, { locale: 'es-AR' });
}
```

`initMercadoPago` configura la biblioteca; no muestra el formulario ni cobra. Su retorno es `void`, por eso no guardamos una instancia en una constante. La inicialización se comparte en el layout.

Ver [entorno de desarrollo](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/development-environment) y [SDK de React](https://github.com/mercadopago/sdk-react).

## 2. Elegir el formulario

Con la biblioteca lista, elegimos cómo recoger los datos de pago. Para tarjetas podemos usar **Card Payment Brick** o un formulario propio con **Secure Fields y Core Methods**. Elegimos **Payment Brick** para reunir varias categorías de pago en un formulario ya armado. Esto resuelve la captura del frontend, no el procesamiento del backend.

Ver [integración de tarjetas](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/payment-integration/websites/cards) y [Payment Brick](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/payment-brick/introduction).

## 3. Configurar Payment Brick

Ahora mostramos el formulario con el importe de la compra y los medios que queremos ofrecer. Importamos `Payment` de `@mercadopago/sdk-react` y lo configuramos con:

- **`initialization`:** recibe `amount`, el total mostrado al comprador. El backend recalcula el importe antes de cobrar.
- **`customization`:** apariencia y categorías habilitadas. Usamos `creditCard`, `debitCard`, `prepaidCard` y `ticket` con `'all'`.
- **`onSubmit`:** recibe los datos al confirmar y conecta el formulario con nuestro backend.

No habilitamos `mercadoPago`, así que no usamos `preferenceId`. **Mostrar una categoría no significa que el backend ya la procese:** nuestro mapper desarrolla el caso de tarjeta; efectivo necesita otra implementación.

Ver [renderizado y callbacks](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/payment-brick/default-rendering).

## 4. Qué pasa al apretar Pagar

El formulario ya está visible; falta conectar la confirmación con nuestro servidor. El Brick prepara los datos y nuestro `onSubmit` los envía al backend:

1. **Tokenización:** los campos seguros envían los datos sensibles directamente a Mercado Pago y reciben un token. El número completo y CVV no pasan por nuestro servidor. Email y documento sí pueden enviarse a nuestro backend.
2. **Callback:** `onSubmit` recibe `paymentType`, `selectedPaymentMethod` y `formData`, con token, cuotas, medio de pago y pagador. En nuestro código el argumento completo también se llama `formData`.
3. **Solicitud propia:** `createCheckoutApiOrder({ items, paymentData: formData })` hace un `POST /api/checkout-api/orders`. El navegador no llama a Orders API con el Access Token.

**El token representa la tarjeta para solicitar el pago; no es un cobro ni una aprobación.** Ver [flujo de tarjetas](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/payment-integration/websites/cards).

## 5. Crear la orden en el backend

Nuestro servidor recibe el token y los datos de compra. Ahora debe calcular cuánto cobrar, convertir los datos al formato de Orders API y solicitar el pago con la credencial privada.

### Elegir el modo de procesamiento

Primero decidimos si queremos procesar el pago al crear la orden o en otra etapa:

- **`automatic`:** Mercado Pago intenta procesar el pago en la solicitud de creación. Lo elegimos porque ya tenemos los datos necesarios.
- **`manual`:** creamos la orden y luego llamamos al endpoint de procesamiento. Sirve para separar ambas etapas; no implica aprobación humana.

`processing_mode` define **cuándo procesar la orden**. `capture_mode` controla por separado la captura de fondos de la tarjeta; no son equivalentes. Usar `automatic` tampoco garantiza aprobación.

Ver [modelo de integración](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/integration-model) y [procesar una orden](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api/process-order/post).

### Preparar la instancia del SDK

Para llamar a Orders API usamos el SDK de Node.js `mercadopago`. Necesita el Access Token privado de nuestra aplicación, guardado como `MP_ACCESS_TOKEN`. Con él configuramos `MercadoPagoConfig` y creamos `new Order(mpConfig)`. Protegemos el módulo con `import 'server-only'`.

Esa instancia, exportada como `order`, permite crear y consultar órdenes. **Inicializarla no cobra; el intento empieza al llamar a `order.create`.**

### Preparar los datos

El objeto que entrega el Brick no es directamente el cuerpo de Orders API: tenemos que adaptarlo. La ruta recibe `items` y `paymentData`, valida el carrito y calcula el total con precios del servidor; ante un carrito inválido responde `400`.

`mapPaymentDataToOrder` transforma los datos al formato de Orders API. Guardamos el resultado en `body`, el cuerpo que enviaremos al crear la orden:

| Campo | Valor o procedencia |
| --- | --- |
| `type` | `'online'` |
| `processing_mode` | `'automatic'` |
| `total_amount` y `transactions.payments[0].amount` | Total del servidor como texto con dos decimales. |
| `external_reference` | Referencia propia; usamos un UUID. No es el ID de Mercado Pago. |
| `payer` | Email e identificación del comprador. |
| `transactions.payments[0].payment_method` | `id`, `type`, `token` e `installments` obtenidos del frontend. |

No enviamos el detalle de productos a Mercado Pago en este mapper: `items` sirve para validar y calcular el total. Tampoco usamos `selectedPaymentMethod`. El formulario propio arma este mismo contrato para reutilizar el backend.

Ver [crear order](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api/create-order/post).

### Idempotencia

Con el cuerpo listo, falta identificar la operación para evitar duplicados al reintentar. Para eso usamos una **clave de idempotencia**, que generamos con `crypto.randomUUID()` y pasamos en `requestOptions.idempotencyKey`:

```ts
const orderCreated = await order.create({
    body,
    requestOptions: { idempotencyKey: crypto.randomUUID() },
});
```

El SDK envía esa clave como encabezado `X-Idempotency-Key`, no dentro del cuerpo.

**La generamos nosotros:** no viene del Brick. Orders API exige el encabezado; una petición HTTP directa sin él responde `400` (`empty_required_header`). El SDK de Node.js 3.6.1 puede generar un UUID si no se proporciona; la pasamos explícitamente para controlar su valor.

Una operación nueva necesita una clave nueva; **un reintento de la misma operación debe conservarla**. Nuestro ejemplo genera otra en cada POST: no evita que dos POST distintos creen dos órdenes. Persistir y reutilizar la clave queda fuera de esta práctica.

### Responder al frontend

Devolvemos solo el ID, porque la página de resultado consultará el estado:

```ts
return NextResponse.json({ id: orderCreated.id });
```

Ante `MercadoPagoError`, la ruta devuelve su estado y mensaje; ante otro error, `500`. El servicio lanza una excepción y el formulario muestra un aviso sin asumir que el pago fue rechazado. Ver la [limitación del SDK para errores específicos](../GUIA.md#manejo-de-errores).

## 6. Consultar el resultado

Crear la orden no confirma por sí solo que el pago esté aprobado. Vamos a una página de resultado que consulta su estado actual, usando **el ID de la orden**, no el de su transacción. En el frontend usamos `router`, obtenido con `useRouter` de `next/navigation`, para navegar después de recibir la respuesta:

```tsx
const order = await createCheckoutApiOrder({ items, paymentData: formData });
router.push(`/order-status?order_id=${encodeURIComponent(order.id)}`);
```

`/order-status` es un Server Component: lee `await searchParams` y consulta `order.get({ id: orderId })` con la credencial privada en el servidor. No necesita otra ruta de API propia. Recargar vuelve a consultar; no hay actualización automática.

Si falta el ID mostramos un aviso. Para manejar una consulta fallida creamos el helper `fetchOrderSafely`: llama a `order.get` dentro de un `try/catch` y devuelve `null` si falla. **No poder consultar no significa que el pago haya fallado.**

Mostramos el aprobado cuando:

```ts
orderStatus.status === 'processed' &&
orderStatus.status_detail === 'accredited'
```

`processed` solo no alcanza. Presentamos total pagado, medio de pago, cuotas y fecha disponibles, y referencia de la orden.

Para `processing` y `action_required` con `waiting_retry` mostramos que el pago sigue en proceso, sin invitar a pagar otra vez. Para `failed` permitimos volver a las opciones de pago. Si falla la consulta ofrecemos consultarla nuevamente; los demás estados usan un aviso de respaldo, sin asumir aprobación ni rechazo. Recargar consulta el estado, pero no inicia otro pago. No desarrollamos cada motivo de rechazo ni las acciones adicionales de todos los estados.

Ver [obtener order](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-api/get-order/get), [estados](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/payment-management/status/order-status) y [seguridad y alcance](../GUIA.md).
