'use client';

import { calculateCartAmount, formatPrice } from '@/features/cart/catalog';
import { useCart } from '@/features/cart/useCart';
import CardForm from '@/features/core-methods/components/CardForm';
import Link from 'next/link';

export default function CoreMethodsPage() {
    const { items } = useCart();
    const amount = calculateCartAmount(items);

    if (items === null) {
        return <main className='flex min-h-dvh items-center justify-center bg-slate-500 p-6 text-slate-100'>Cargando carrito…</main>;
    }

    return (
        <main className='flex min-h-dvh items-center justify-center bg-slate-500 px-4 py-10 text-slate-100 sm:px-6'>
            <section className='w-full max-w-xl'>
                <Link
                    href='/options'
                    className='text-sm font-medium underline-offset-4 hover:text-blue-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400'
                >
                    Volver a las opciones
                </Link>
                <h1 className='mt-5 text-2xl font-semibold'>Formulario personalizado</h1>
                {amount === null ? (
                    <p className='mt-3 text-slate-100'>Tu carrito está vacío. <Link href='/' className='underline'>Volver a los productos</Link></p>
                ) : (
                    <>
                        <p className='mt-2 text-slate-100'>Total del carrito: {formatPrice(amount)}</p>
                        <div className='mt-6 rounded-2xl border border-slate-600 bg-slate-800 p-6 sm:p-8'>
                            <CardForm amount={amount} items={items} />
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}
