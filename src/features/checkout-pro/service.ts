import type { CartItem } from '@/types/mercadopago.types';

/** Carrito enviado a nuestra API de Checkout Pro, sin datos de tarjeta. */
export type CreateCheckoutProOrderRequest = {
    items: CartItem[];
};

/** ID y URL de pago que nuestra API devuelve para redirigir a Checkout Pro. */
export type CreateCheckoutProOrderResponse = {
    id: string;
    checkout_url: string;
};

export async function createCheckoutProOrder(body: CreateCheckoutProOrderRequest): Promise<CreateCheckoutProOrderResponse> {
    const response = await fetch('/api/checkout-pro/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error('No se pudo crear la orden de Checkout Pro');
    }

    return result;
}
