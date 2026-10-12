# Mercado Pago Integration Lab

Práctica de integración de pagos con **Next.js, TypeScript y Mercado Pago**, con ejemplos de Checkout API y Checkout Pro mediante Orders API.

## Por qué hice este proyecto

Lo hice para aprender cómo funciona una integración de pagos y documentar cada paso. Mercado Pago ofrece [MCP Server, plugins y otras herramientas para trabajar con IA](https://www.mercadopago.com.ar/developers/es/docs/ai-resources) que aceleran la implementación; este proyecto busca entender qué hace el código y cómo se conectan sus partes.

**Es un laboratorio de aprendizaje, no una tienda lista para producción ni una integración oficial de Mercado Pago.**

## Qué incluye

- Catálogo y carrito de demostración, guardado en el navegador.
- **Checkout API + Orders API:** Payment Brick para capturar datos y backend para crear la orden. El ejemplo desarrolla el pago con tarjeta; mostrar efectivo no significa que esté implementado.
- **Formulario personalizado + Orders API:** Secure Fields y Core Methods para capturar la tarjeta, consultar cuotas y solicitar el pago con el backend compartido.
- **Checkout Pro + Orders API:** creación de la orden y redirección al checkout de Mercado Pago.
- Consulta de la orden desde el servidor, con mensajes para aprobado, en proceso, fallido, error de consulta y otros estados.
- Regreso a las opciones cuando el comprador abandona Checkout Pro sin pagar.
- Guías sobre las decisiones, las credenciales, la tokenización y los límites del ejemplo.

Tecnologías: Next.js App Router, React, TypeScript, Tailwind CSS y SDKs oficiales de Mercado Pago para React y Node.js.

## Ejecutarlo localmente

Necesitás Node.js compatible con el proyecto, pnpm y una aplicación de Mercado Pago con credenciales de prueba.

1. Instalá las dependencias con `pnpm install`.
2. Copiá `.env.example` a `.env.local` y completá las credenciales de prueba. Si ya usás `.env`, actualizalo en lugar de mantener configuraciones contradictorias en ambos archivos.
3. Ejecutá `pnpm dev`.
4. Abrí [localhost:3000](http://localhost:3000), agregá productos y elegí la integración en `/options`.

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Public Key para inicializar el SDK del navegador. |
| `MP_ACCESS_TOKEN` | Access Token privado del servidor. Nunca agregarle `NEXT_PUBLIC_` ni subirlo a Git. |
| `APP_URL` | Base de las URLs de retorno de Checkout Pro. En local, `http://localhost:3000`; al desplegar, el dominio público HTTPS. |

**No uses tu cuenta ni tarjetas reales para probar pagos.** En Checkout Pro, iniciá sesión con un comprador de prueba. Incógnito es opcional: separa sesiones, pero no activa un entorno de prueba. Revisá el [procedimiento y los pendientes](docs/GUIA-CHECKOUT-PRO-ORDERS.md#7-probar-sin-dinero-real) antes de confirmar un pago.

## Documentación

1. [Guía general: APIs, Bricks, arquitectura y seguridad](GUIA.md).
2. [Implementar Checkout API + Orders API](docs/GUIA-CHECKOUT-API-ORDERS.md).
3. [Implementar Checkout Pro + Orders API](docs/GUIA-CHECKOUT-PRO-ORDERS.md).
4. [Implementar Secure Fields + Core Methods + Orders API](docs/GUIA-CORE-METHODS-ORDERS.md).

## Organización

```text
src/
  app/                    Páginas y rutas de API de Next.js
  features/
    cart/                 Catálogo, cálculo del importe y hook del carrito
    checkout-api/         Service del frontend y mapper de Orders
    checkout-pro/         Service del frontend y mapper de Orders
    core-methods/         Formulario propio y hook de pago
  lib/                    Configuración compartida y privada de Mercado Pago
  types/                  Tipos compartidos del ejemplo
docs/                     Guías de implementación
```

Las rutas permanecen en `app`; cada integración agrupa su lógica en `features`. Los mappers se usan desde el backend y los services llaman a nuestras rutas desde el frontend.

## Alcance y próximos pasos

El regreso sin pagar de Checkout Pro fue probado. Los resultados aprobado, rechazado y pendiente de ese flujo necesitan verificarse por separado. Para seguir el procedimiento oficial de pruebas todavía falta enviar `payer.email` del comprador de prueba en el mapper de Checkout Pro.

Quedan fuera los webhooks, la persistencia de compras, los permisos de acceso y el manejo completo de estados, reintentos y solicitudes abusivas. Para Orders usamos nuestra propia pantalla de estado, no Status Screen Brick. Revisá también la [limitación del SDK al manejar errores](GUIA.md#manejo-de-errores).
