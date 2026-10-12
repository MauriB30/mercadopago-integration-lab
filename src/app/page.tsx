'use client';

import { useCart } from '@/features/cart/useCart';
import { calculateCartAmount, DEMO_PRODUCTS, formatPrice } from '@/features/cart/catalog';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
    const { items, updateQuantity } = useCart();
    const itemCount = items?.reduce((count, item) => count + item.quantity, 0) ?? 0;
    const total = items?.length ? (calculateCartAmount(items) ?? 0) : 0;

    return (
        <main className='min-h-dvh bg-slate-500 px-4 py-8 sm:px-6 sm:py-12'>
            <div className='mx-auto w-full max-w-6xl'>
                <header className='mb-8'>
                    <h1 className='text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl'>Elegí tus productos</h1>
                    <p className='mt-3 max-w-2xl text-slate-300'>
                        Agregá productos al carrito para practicar una compra. Los productos y precios son de prueba.
                    </p>
                </header>

                <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start'>
                    <section aria-label='Productos' className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
                        {DEMO_PRODUCTS.map((product) => {
                            const quantity = items?.find((item) => item.productId === product.id)?.quantity ?? 0;

                            return (
                                <article key={product.id} className='overflow-hidden rounded-xl border border-slate-600 bg-slate-800'>
                                    <Image
                                        src={product.image}
                                        alt={`Fotografía de ${product.name}`}
                                        width={1024}
                                        height={1024}
                                        sizes='(min-width: 1280px) 260px, (min-width: 640px) 45vw, 90vw'
                                        loading='eager'
                                        className='aspect-square w-full object-cover brightness-90'
                                    />
                                    <div className='flex flex-col gap-3 p-5'>
                                        <div>
                                            <h2 className='text-lg font-semibold text-slate-100'>{product.name}</h2>
                                            <p className='mt-1 min-h-12 text-sm leading-6 text-slate-300'>{product.description}</p>
                                        </div>
                                        <p className='text-xl font-semibold text-slate-100'>{formatPrice(product.price)}</p>
                                        <button
                                            type='button'
                                            onClick={() => updateQuantity(product.id, quantity + 1)}
                                            disabled={items === null || quantity >= 10}
                                            className='min-h-11 cursor-pointer rounded-lg border border-slate-500 px-4 py-2 font-medium text-slate-100 transition-colors hover:bg-slate-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
                                        >
                                            {quantity === 0 ? 'Agregar al carrito' : 'Agregar otro'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    <aside className='rounded-xl border border-slate-600 bg-slate-800 p-6 lg:sticky lg:top-6' aria-label='Carrito de compra'>
                        <h2 className='text-xl font-semibold text-slate-100'>Tu carrito</h2>
                        {items === null ? (
                            <p className='mt-5 text-sm text-slate-300'>Cargando carrito…</p>
                        ) : items.length === 0 ? (
                            <p className='mt-5 text-sm leading-6 text-slate-300'>Todavía no agregaste productos.</p>
                        ) : (
                            <ul className='mt-4 divide-y divide-slate-600'>
                                {DEMO_PRODUCTS.filter((product) => items.some((item) => item.productId === product.id)).map((product) => {
                                    const quantity = items.find((item) => item.productId === product.id)!.quantity;

                                    return (
                                        <li key={product.id} className='py-4'>
                                            <div className='flex items-start justify-between gap-3'>
                                                <span className='font-medium text-slate-100'>{product.name}</span>
                                                <span className='text-sm text-slate-300'>{formatPrice(product.price * quantity)}</span>
                                            </div>
                                            <div className='mt-3 flex items-center gap-3'>
                                                <button
                                                    type='button'
                                                    onClick={() => updateQuantity(product.id, quantity - 1)}
                                                    aria-label={`Quitar una unidad de ${product.name}`}
                                                    className='flex size-11 cursor-pointer items-center justify-center rounded-lg border border-slate-500 text-xl text-slate-100 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                >
                                                    −
                                                </button>
                                                <span className='min-w-5 text-center font-medium text-slate-100' aria-label={`${quantity} unidades`}>
                                                    {quantity}
                                                </span>
                                                <button
                                                    type='button'
                                                    onClick={() => updateQuantity(product.id, quantity + 1)}
                                                    disabled={quantity >= 10}
                                                    aria-label={`Agregar una unidad de ${product.name}`}
                                                    className='flex size-11 cursor-pointer items-center justify-center rounded-lg border border-slate-500 text-xl text-slate-100 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <div className='mt-4 flex justify-between border-t border-slate-600 pt-4 font-semibold text-slate-100'>
                            <span>
                                Total ({itemCount} {itemCount === 1 ? 'unidad' : 'unidades'})
                            </span>
                            <span>{formatPrice(total)}</span>
                        </div>
                        {itemCount > 0 ? (
                            <Link
                                href='/options'
                                className='mt-6 flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600'
                            >
                                Elegir medio de pago
                            </Link>
                        ) : (
                            <button
                                type='button'
                                disabled
                                className='mt-6 min-h-11 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white opacity-50'
                            >
                                Elegir medio de pago
                            </button>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}
