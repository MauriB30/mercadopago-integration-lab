# Implementación: formulario personalizado + Orders API

Con esta forma, **el comprador paga en nuestro sitio con un formulario que armamos nosotros**, en lugar de uno ya coordinado por un Brick.

Usamos tres piezas: **Secure Fields** captura la tarjeta de forma segura; **Core Methods** consulta información como el medio de pago y las cuotas; **Orders API** solicita el pago desde nuestro backend. La documentación llama “integración con Core Methods” a este camino, pero no significa que todo sea un único módulo.

Vamos a seguir el recorrido del comprador: ve el formulario, ingresa la tarjeta, elige cuotas, completa sus datos y paga. El ejemplo usa una tarjeta de prueba aprobada; no desarrolla todos los casos de producción.

## 1. Mostrar el formulario

Primero necesitamos campos donde el comprador pueda ingresar sus datos. **Los de tarjeta los proporciona Mercado Pago; los de nombre, documento y email los hacemos nosotros.**

Como usamos React, elegimos `@mercadopago/sdk-react`. Es una adaptación de MercadoPago.js: importamos sus componentes y funciones sin agregar un script ni crear manualmente una instancia con `new MercadoPago(...)`.

Configuramos la biblioteca con la **Public Key** de nuestra aplicación, obtenida del panel de desarrolladores:

```tsx
import { initMercadoPago } from '@mercadopago/sdk-react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
if (PUBLIC_KEY) initMercadoPago(PUBLIC_KEY, { locale: 'es-AR' });
```

`initMercadoPago` prepara el SDK en el navegador; no muestra el formulario ni cobra. Compartimos esa inicialización desde el layout. El Access Token privado queda en el backend.

Después importamos y renderizamos los campos seguros:

```tsx
import { CardNumber, ExpirationDate, SecurityCode } from '@mercadopago/sdk-react';

// Dentro del formulario:
<CardNumber onBinChange={handleBinChange} />
<ExpirationDate mode='short' />
<SecurityCode />
```

**No leemos ni guardamos el número completo o CVV en estado de React.** Quedan dentro de los campos seguros. En el próximo paso conectamos `handleBinChange`, que recibe información del prefijo de la tarjeta, no su número completo.

> Estilos: la prop `style` configura el interior del campo seguro; Tailwind se aplica al contenedor exterior. `mode='short'` usa el año de dos dígitos.

Ver [SDK de React](https://github.com/mercadopago/sdk-react) y [Secure Fields](https://github.com/mercadopago/sdk-js/blob/main/docs/fields.md).

## 2. El comprador ingresa la tarjeta

Al escribir, necesitamos saber qué medio de pago está usando. Para eso sirve el **BIN**, el prefijo del número de tarjeta que permite consultar información sobre ella.

`CardNumber` avisa sus cambios mediante `onBinChange`. Nuestra función `handleBinChange` recibe un objeto `data` con la propiedad `bin`. Cuando hay BIN, consulta:

```tsx
const response = await getPaymentMethods({ bin: data.bin });
const paymentMethod = response?.results[0];
```

Esta función se importa de `@mercadopago/sdk-react`. En el ejemplo usamos el primer resultado y guardamos:

- `name`: nombre para mostrar, como Mastercard.
- `id`: identificador del medio, como `master`.
- `payment_type_id`: tipo, como `credit_card`.

**Ya identificamos la tarjeta; todavía no generamos un token ni solicitamos un pago.**

> Detalle del SDK: mantenemos `handleBinChange` estable con `useCallback`. En la versión instalada, cambiar su referencia reinicia el campo y borra lo escrito. Solo cambia cuando cambia el importe.

## 3. El comprador elige las cuotas

Con el BIN consultamos las cuotas disponibles para `amount`, el importe de la compra mostrado en el formulario:

```tsx
const response = await getInstallments({
    amount: amount.toString(),
    bin: data.bin,
});
const options = response?.[0]?.payer_costs ?? [];
```

`getInstallments` también se importa del SDK. La versión instalada recibe el importe como texto. Cada opción incluye `installments`, la cantidad de cuotas, y `recommended_message`, el texto que mostramos en el selector. También trae el importe por cuota y el total financiado; **no todas las opciones son sin interés**.

Guardamos las opciones en `installments` y la cantidad elegida en `selectedInstallments`. Al cambiar el BIN limpiamos las opciones y la selección para no conservar cuotas de otra tarjeta; si se borra el BIN, también limpiamos la tarjeta detectada.

**Ya tenemos el medio de pago y las cuotas que enviaremos al pagar.** El backend recalculará el importe antes de solicitar el cobro.

Ver [Core Methods](https://github.com/mercadopago/sdk-js/blob/main/docs/core-methods.md).

## 4. El comprador completa sus datos

Ahora necesitamos nombre del titular, tipo y número de documento, y email. Los recogemos con inputs comunes de nuestra aplicación.

Para ofrecer los tipos de documento, al montar el formulario consultamos:

```tsx
const response = await getIdentificationTypes();
```

La función se importa del SDK y devuelve los tipos disponibles según la Public Key. Los mostramos en un selector en lugar de dejar “DNI” fijo.

**Nombre y documento se usan para generar el token; email y documento se envían al backend para crear la orden.** Estos datos sí pueden pasar por nuestra aplicación, a diferencia del número completo de tarjeta y CVV.

## 5. El comprador aprieta Pagar

Con los datos completos, nuestra función `handlePay` comprueba los campos básicos, la tarjeta detectada y las cuotas elegidas. Después realiza dos solicitudes distintas: **primero genera el token con Mercado Pago y luego solicita el pago a nuestro backend**.

### Generar el token

El token es un identificador que representa la tarjeta para solicitar el pago sin enviar su número completo ni CVV a nuestro servidor. Lo obtenemos con `createCardToken`, importada del SDK:

```tsx
const token = await createCardToken({
    cardholderName: cardholderName.trim(),
    identificationType: selectedIdentificationType,
    identificationNumber: identificationNumber.trim(),
});
```

No pasamos el número de tarjeta ni CVV a esta función: el SDK toma esos datos de los campos seguros y los envía directamente a Mercado Pago. La respuesta contiene `token.id`. **Tokenizar no cobra ni significa que el pago esté aprobado.**

### Enviarlo a nuestro backend

Armamos `paymentData` con el mismo formato que entrega Payment Brick para reutilizar su integración:

- `paymentType` y `selectedPaymentMethod`: tipo detectado, por ejemplo `credit_card`.
- `formData`: `token.id`, `payment_method_id`, cuotas y `payer` con email e identificación.

Lo enviamos junto con el carrito usando nuestro servicio:

```tsx
const order = await createCheckoutApiOrder({ items, paymentData });
```

El servicio hace `POST /api/checkout-api/orders`. Allí el servidor valida la compra, recalcula el importe y el mapper adapta los datos para Orders API. Finalmente llama a `order.create` en modo `automatic`, que intenta procesar el pago al crear la orden, y devuelve `{ id }`.

No necesitamos otra ruta ni otro mapper. Ver el [paso 5 de Checkout API + Orders API](GUIA-CHECKOUT-API-ORDERS.md#5-crear-la-orden-en-el-backend) para la configuración privada, el cuerpo de la orden y la idempotencia.

Mientras se procesa, deshabilitamos el botón; si falla mostramos un error. No persistimos ni mostramos el token.

## 6. Mostrar el resultado

La respuesta del backend nos da el ID de la orden, **no una confirmación de aprobación**. Usamos `router`, obtenido con `useRouter` de Next.js, para ir a la página de resultado:

```tsx
router.push(`/order-status?order_id=${encodeURIComponent(order.id)}`);
```

Esa página consulta `order.get` desde el servidor y muestra el resultado actual. Reutilizamos la misma pantalla de Payment Brick; tampoco hace falta crear otra.

Ver el [paso 6 de Checkout API + Orders API](GUIA-CHECKOUT-API-ORDERS.md#6-consultar-el-resultado) para la consulta y el caso aprobado.

## Para seguir el código

`useCardPayment` reúne las consultas y el envío que acabamos de recorrer. `CardFields` muestra tarjeta y cuotas, `PayerFields` muestra los datos del comprador y `CardForm` conecta ambas secciones con el botón Pagar.

## Alcance

**Pagar ya solicita el cobro: usá únicamente credenciales y datos de prueba.** Seguimos el recorrido principal con una tarjeta aprobada, no todos los emisores o estados.

Quedan fuera el tratamiento completo de errores y respuestas fuera de orden al cambiar de tarjeta, webhooks, permisos y reintentos con idempotencia persistida. Deshabilitar el botón no sustituye esos controles. Ver [seguridad y alcance](../GUIA.md).
