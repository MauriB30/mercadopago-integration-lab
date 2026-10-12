import type { CreateOrderRequest } from '@/types/mercadopago.types';

/** ID de la orden que nuestra API devuelve al frontend; obligatorio en una respuesta exitosa. */
export type CreateOrderResponse = {
    id: string;
};

export async function createCheckoutApiOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await fetch('/api/checkout-api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error('No se pudo crear la orden');
    }

    return result;
}
