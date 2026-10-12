import { calculateCartAmount } from '@/features/cart/catalog';
import { mapPaymentDataToOrder } from '@/features/checkout-api/mapper';
import { order } from '@/lib/mercadopago';
import { CreateOrderRequest } from '@/types/mercadopago.types';
import { MercadoPagoError } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { items, paymentData }: CreateOrderRequest = await request.json();
        const amount = calculateCartAmount(items);

        if (amount === null) {
            return NextResponse.json({ error: 'Carrito inválido o vacío' }, { status: 400 });
        }

        const body = mapPaymentDataToOrder(paymentData, {
            amount,
            externalReference: crypto.randomUUID(),
        });

        const orderCreated = await order.create({
            body,
            requestOptions: { idempotencyKey: crypto.randomUUID() },
        });

        return NextResponse.json({ id: orderCreated.id });
    } catch (error) {
        console.error('Error al crear la orden:', error);

        if (error instanceof MercadoPagoError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
    }
}
