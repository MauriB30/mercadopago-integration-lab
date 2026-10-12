'use client';

import { useCart } from '@/features/cart/useCart';
import { calculateCartAmount, formatPrice } from '@/features/cart/catalog';
import { createCheckoutProOrder } from '@/features/checkout-pro/service';
import { CartItem } from '@/types/mercadopago.types';
import Link from 'next/link';
import { useState } from 'react';

export default function CheckoutProPage() {
    const { items } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const amount = calculateCartAmount(items);

    if (items === null) {
        return <main className='flex min-h-dvh items-center justify-center bg-slate-500 p-6 text-slate-300'>Cargando carrito…</main>;
    }

    if (amount === null) {
        return (
            <main className='flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-500 p-6 text-center'>
                <h1 className='text-2xl font-semibold text-slate-100'>Tu carrito está vacío</h1>
                <Link
                    href='/'
                    className='font-medium text-blue-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400'
                >
                    Volver a los productos
                </Link>
            </main>
        );
    }

    async function handleCheckout(items: CartItem[]) {
        setIsLoading(true);
        setError(null);

        try {
            const order = await createCheckoutProOrder({ items });
            window.location.href = order.checkout_url;
        } catch (error) {
            console.error('Error al iniciar Checkout Pro:', error);
            setError('No pudimos abrir el pago en Mercado Pago. Intentá nuevamente.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className='flex min-h-dvh items-center justify-center bg-slate-500 p-6'>
            <div className='w-full max-w-2xl rounded-lg border border-slate-600 bg-slate-800 p-8 text-slate-100'>
                <h1 className='text-2xl font-semibold'>Checkout Pro vía Orders API</h1>
                <p className='mt-3 text-slate-300'>Te vamos a llevar a Mercado Pago para que elijas cómo pagar y completes tu compra.</p>
                <p className='mt-6 text-xl font-semibold'>Total: {formatPrice(amount)}</p>
                <button
                    type='button'
                    onClick={() => handleCheckout(items)}
                    disabled={isLoading}
                    className='mt-6 min-h-11 w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 disabled:cursor-wait disabled:opacity-60'
                >
                    {isLoading ? 'Abriendo Mercado Pago…' : 'Ir a pagar a Mercado Pago'}
                </button>
                {error ? (
                    <p role='alert' className='mt-4 text-red-300'>
                        {error}
                    </p>
                ) : null}
                <Link
                    href='/options'
                    className='mt-6 inline-block font-medium text-blue-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
                >
                    Volver a las opciones
                </Link>
            </div>
        </main>
    );
}
