<div align="center">

# Mercado Pago Integration Lab

**Tres integraciones. Un mismo carrito. Paso a paso.**

Laboratorio para entender e implementar pagos con Mercado Pago usando Next.js y Orders API.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

[Explorar integraciones](#integraciones) · [Ejecutar el proyecto](#ejecutarlo-localmente) · [Leer las guías](#documentación)

</div>

---

> **Proyecto de aprendizaje.** No es una tienda lista para producción ni una integración oficial de Mercado Pago.

## Integraciones

¿Querés que el comprador pague en tu sitio o redirigirlo a Mercado Pago? El proyecto permite explorar ambas opciones y comparar un formulario listo para usar con uno personalizado.

| Opción | ¿Dónde paga? | ¿Cómo se capturan los datos? | Guía |
| --- | --- | --- | --- |
| **Payment Brick** | En tu sitio | Componente de pago de Mercado Pago | [Checkout API](docs/GUIA-CHECKOUT-API-ORDERS.md) |
| **Core Methods** | En tu sitio | Formulario propio con Secure Fields y métodos del SDK | [Formulario personalizado](docs/GUIA-CORE-METHODS-ORDERS.md) |
| **Checkout Pro** | En Mercado Pago | Checkout alojado por Mercado Pago | [Checkout Pro](docs/GUIA-CHECKOUT-PRO-ORDERS.md) |

Las tres opciones usan **Orders API** en el backend. Payment Brick y Core Methods comparten la ruta que crea la orden de Checkout API.

## Qué podés probar

- Agregar productos a un carrito de demostración, guardado en el navegador.
- Elegir una de las tres integraciones desde `/options`.
- Pagar con tarjeta y consultar la orden desde el servidor.
- Ver una pantalla propia con el resultado: aprobado, en proceso, fallido u otros estados.
- Volver a las opciones al abandonar Checkout Pro sin pagar.

El backend calcula el importe con los precios del catálogo. El ejemplo de Checkout API desarrolla **pagos con tarjeta**: mostrar efectivo en el Brick no significa que ese flujo esté implementado.

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

> **Probá sin dinero real.** No uses tu cuenta ni tarjetas reales para probar pagos. En Checkout Pro, iniciá sesión con un comprador de prueba. Incógnito separa sesiones, pero **no activa un entorno de prueba**. Revisá el [procedimiento y los pendientes](docs/GUIA-CHECKOUT-PRO-ORDERS.md#7-probar-sin-dinero-real) antes de confirmar un pago.

## Documentación

**Empezá por la [guía general](GUIA.md)** para entender cómo se relacionan los checkouts, las APIs y los Bricks, y qué medidas de seguridad necesita una integración.

Después, elegí el recorrido que te interese:

- **Quiero un formulario de pago ya armado:** [Payment Brick + Orders API](docs/GUIA-CHECKOUT-API-ORDERS.md).
- **Quiero controlar mi propio formulario:** [Secure Fields + Core Methods + Orders API](docs/GUIA-CORE-METHODS-ORDERS.md).
- **Quiero que Mercado Pago se encargue del checkout:** [Checkout Pro + Orders API](docs/GUIA-CHECKOUT-PRO-ORDERS.md).

## Organización

<details>
<summary>Ver la estructura del proyecto</summary>

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

</details>

## Alcance y próximos pasos

El regreso sin pagar de Checkout Pro fue probado. Los resultados aprobado, rechazado y pendiente de ese flujo necesitan verificarse por separado. Para seguir el procedimiento oficial de pruebas todavía falta enviar `payer.email` del comprador de prueba en el mapper de Checkout Pro.

Quedan fuera los webhooks, la persistencia de compras, los permisos de acceso y el manejo completo de estados, reintentos y solicitudes abusivas. Para Orders usamos nuestra propia pantalla de estado, no Status Screen Brick. Revisá también la [limitación del SDK al manejar errores](GUIA.md#manejo-de-errores).

## Por qué hice este proyecto

Lo hice para aprender cómo funciona una integración de pagos y dejar una explicación clara de cada paso. Mercado Pago ofrece [MCP Server, plugins y otras herramientas para trabajar con IA](https://www.mercadopago.com.ar/developers/es/docs/ai-resources) que aceleran la implementación; este laboratorio busca entender **qué hace el código y cómo se conectan sus partes**.
