import { calculateCartAmount } from '@/features/cart/catalog';
import { order } from '@/lib/mercadopago';
import { mapCheckoutProToOrder } from '@/features/checkout-pro/mapper';
import type { CartItem } from '@/types/mercadopago.types';
import { MercadoPagoError } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { items }: { items: CartItem[] } = await request.json();
        const amount = calculateCartAmount(items);

        if (amount === null) {
            return NextResponse.json({ error: 'Carrito inválido o vacío' }, { status: 400 });
        }

        const returnUrl = new URL('/order-status', process.env.APP_URL ?? request.nextUrl.origin).toString();

        const body = mapCheckoutProToOrder(items, {
            amount,
            externalReference: crypto.randomUUID(),
            returnUrl,
        });

        const orderCreated = await order.create({
            body,
            requestOptions: { idempotencyKey: crypto.randomUUID() },
        });

        return NextResponse.json({ id: orderCreated.id, checkout_url: orderCreated.checkout_url });
    } catch (error) {
        console.error('Error al crear la orden de Checkout Pro:', error);

        if (error instanceof MercadoPagoError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Error al crear la orden de Checkout Pro' }, { status: 500 });
    }
}
