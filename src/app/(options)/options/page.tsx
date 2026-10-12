'use client';

import { useCart } from '@/features/cart/useCart';
import { calculateCartAmount, formatPrice } from '@/features/cart/catalog';
import Link from 'next/link';

export default function PaymentOptionsPage() {
    const { items } = useCart();

    if (items === null) {
        return <main className='flex min-h-dvh items-center justify-center bg-slate-500 p-6 text-slate-100'>Cargando carrito…</main>;
    }

    if (items.length === 0) {
        return (
            <main className='flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-500 p-6 text-center'>
                <h1 className='text-2xl font-semibold text-slate-100'>Tu carrito está vacío</h1>
                <Link
                    href='/'
                    className='font-medium text-slate-100 underline-offset-4 hover:text-blue-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
                >
                    Volver a los productos
                </Link>
            </main>
        );
    }

    const total = calculateCartAmount(items) ?? 0;
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <main className='flex min-h-screen flex-col items-center justify-center bg-slate-500 p-6'>
            <h1 className='mb-3 text-3xl font-bold text-slate-100'>Elegí cómo pagar</h1>
            <p className='mb-8 text-center text-slate-300'>
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en el carrito. Total: {formatPrice(total)}
            </p>

            <div className='grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Enlace al Payment Brick */}
                <Link
                    href='/payment-brick'
                    className='flex flex-col items-center justify-center rounded-lg border border-slate-600 bg-slate-800 p-8 transition-colors hover:border-slate-400 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
                >
                    <h2 className='mb-2 text-xl font-semibold text-slate-100'>Payment Brick</h2>
                    <p className='text-center text-sm text-slate-300'>Componente completo para tarjetas, dinero en cuenta y efectivo.</p>
                </Link>

                <Link
                    href='/checkout-pro'
                    className='flex flex-col items-center justify-center rounded-lg border border-slate-600 bg-slate-800 p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
                >
                    <h2 className='mb-2 text-xl font-semibold text-slate-100'>Checkout Pro</h2>
                    <p className='text-sm text-slate-300'>Pagá en Mercado Pago y volvé a la tienda.</p>
                </Link>

                <Link
                    href='/core-methods'
                    className='flex flex-col items-center justify-center rounded-lg border border-slate-600 bg-slate-800 p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
                >
                    <h2 className='mb-2 text-xl font-semibold text-slate-100'>Formulario personalizado</h2>
                    <p className='text-sm text-slate-300'>Campos seguros de Mercado Pago y un formulario propio. Integración con Core Methods paso a paso.</p>
                </Link>
            </div>

            <Link
                href='/'
                className='mt-8 text-sm font-medium text-slate-100 underline-offset-4 hover:text-blue-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
            >
                Volver al carrito
            </Link>
        </main>
    );
}
