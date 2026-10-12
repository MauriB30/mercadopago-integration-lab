# Guía de integración: Mercado Pago

## Objetivo

Una práctica para entender las opciones de Mercado Pago, implementar un flujo de pago y saber dónde encaja cada parte. Explicamos nuestras decisiones sin desarrollar una tienda completa ni reemplazar la documentación oficial.

## Checkout, APIs y componentes

El tipo de checkout define **dónde paga el comprador**; la API define cómo integramos la operación:

| Tipo de checkout | API anterior | API nueva/recomendada |
| --- | --- | --- |
| **Checkout Pro** — paga en Mercado Pago | Preferences API | Orders API |
| **Checkout API** — paga en nuestro sitio | Payments API | Orders API |

Son cuatro combinaciones, pero tres APIs en este cuadro. Orders se usa con ambos checkouts, con flujos distintos. Ver [Checkout Pro](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-orders/overview) y [Checkout API](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/integration-model).

### Por qué existe Orders API

Preferences prepara una compra para Checkout Pro; crear la preferencia todavía no cobra. Payments permite crear y procesar pagos en Checkout API.

Orders organiza la operación y sus transacciones alrededor de una orden. Con Checkout Pro devuelve una URL para pagar; con Checkout API permite procesar al crear la orden o después. Mercado Pago la recomienda para integraciones nuevas de [Checkout API](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-payments/overview) y [Checkout Pro](https://www.mercadopago.com.ar/developers/es/reference/online-payments/checkout-pro-orders/overview).

**En este proyecto usamos Orders API.** No necesitamos llamar además a Payments o Preferences para el mismo cobro.

### Bricks, Secure Fields y Core Methods

No son APIs para cobrar ni medios de pago:

- **Bricks:** componentes que resuelven una parte de la interfaz, como Payment Brick y su formulario.
- **Secure Fields:** campos individuales para ingresar los datos sensibles de tarjeta.
- **Core Methods:** funciones para consultar información como documentos, medios de pago, emisores y cuotas.

Tarjeta y efectivo sí son medios de pago. Elegir un componente no cambia la API del backend ni garantiza que todos los Bricks sean compatibles con ella. En nuestros ejemplos, tanto Payment Brick como el formulario propio usan Orders API.

## Frontend y backend

| Entorno | SDK | Credencial | Responsabilidad |
| --- | --- | --- | --- |
| Navegador | `@mercadopago/sdk-react` | Public Key | Componentes, consultas del formulario y tokenización. |
| Servidor | `mercadopago` | Access Token | Crear y consultar órdenes. |

Para Checkout Pro con redirección no hace falta inicializar el SDK del frontend: la captura de datos ocurre en Mercado Pago.

## Seguridad

### Tarjeta y token

En Checkout Pro, los datos se ingresan en Mercado Pago. En Checkout API, los campos seguros envían el número completo y CVV directamente a Mercado Pago para obtener un token; **no pasan por nuestro backend**.

Nuestro servidor recibe el token y datos del comprador, como email y documento. **El token no es un pago aprobado ni es público:** no debe compartirse, persistirse innecesariamente o registrarse en logs. Ver [integración de tarjetas](https://www.mercadopago.com.ar/developers/es/docs/checkout-api-orders/payment-integration/websites/cards).

### Credenciales

La Public Key está pensada para el navegador. El Access Token queda en el servidor: nunca en una variable `NEXT_PUBLIC_`, una URL o el repositorio. Ver [credenciales](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/additional-content/your-integrations/credentials).

Usamos `import 'server-only'` en el módulo de configuración privado para que Next.js impida importarlo desde código cliente. No cifra la clave ni reemplaza el cuidado de las credenciales. Ver [protección de módulos](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning).

### HTTPS y validaciones

HTTPS cifra el tráfico, detecta alteraciones y permite verificar la identidad del servidor. **No impide que el propio usuario modifique una solicitud desde su navegador.** En producción, nuestro sitio también debe usar HTTPS. Ver [TLS](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security).

Nuestra aplicación sigue siendo responsable de:

- Validar productos y cantidades, y calcular precios en el servidor.
- Autorizar el acceso a cada compra: conocer un ID no otorga permiso.
- Consultar Mercado Pago para confirmar el resultado; una redirección no prueba un cobro.
- Reutilizar la clave de idempotencia al reintentar la misma operación.
- Validar la autenticidad de las notificaciones cuando se implementen.

## Manejo de errores

Si querés mostrar motivos específicos de rechazo, tené en cuenta una limitación del SDK de Node.js `mercadopago` **3.6.1**: al lanzar una excepción, no conserva los campos `errors` y `data` de algunas respuestas de Orders API. Por eso puede entregar solo el estado HTTP y el mensaje genérico `MercadoPago API error`, aunque la API haya enviado un motivo detallado. Ver [implementación del error](https://github.com/mercadopago/sdk-nodejs/blob/master/src/utils/errors/index.ts).

Manejá la excepción con `try/catch` y usá un mensaje general si el detalle no está disponible: **un `402` por sí solo no identifica el motivo del rechazo**. Para mostrarlo, necesitás una versión o implementación que conserve ese dato; revisá esta limitación al actualizar el SDK. No confundas un error de solicitud con el estado confirmado del pago.

## Alcance de la práctica

Seguimos el recorrido principal, con una pantalla compartida para aprobado, en proceso, fallido y error de consulta, y un aviso de respaldo para otros estados. No implementamos todos los estados, webhooks, persistencia de compras, permisos ni reintentos completos. **No es una tienda lista para producción.**

## Qué opción elegir

- **¿Querés que el comprador pague en Mercado Pago y después vuelva a tu sitio?** Usá [Checkout Pro + Orders API](docs/GUIA-CHECKOUT-PRO-ORDERS.md).
- **¿Querés que pague en tu sitio con un formulario ya armado por Mercado Pago?** Usá [Payment Brick + Orders API](docs/GUIA-CHECKOUT-API-ORDERS.md).
- **¿Querés que pague en tu sitio, pero armar tu propio formulario y controlar las consultas de tarjeta y cuotas?** Usá [Secure Fields + Core Methods + Orders API](docs/GUIA-CORE-METHODS-ORDERS.md).
