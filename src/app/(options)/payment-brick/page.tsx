'use client';

import { useCart } from '@/features/cart/useCart';
import { calculateCartAmount, formatPrice } from '@/features/cart/catalog';
import { createCheckoutApiOrder } from '@/features/checkout-api/service';
import { Payment } from '@mercadopago/sdk-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, useState } from 'react';

/** Props del Payment Brick; se usan para tipar initialization y customization. */
type PaymentProps = ComponentProps<typeof Payment>;
type PaymentCustomization = PaymentProps['customization'];
type PaymentInitialization = PaymentProps['initialization'];

const CUSTOMIZATION: PaymentCustomization = {
    // Medios de pago que el Brick puede mostrar; 'all' habilita los disponibles de cada categoría.
    visual: {
        style: {
            customVariables: {
                // Fondo del contenedor general
                formBackgroundColor: '#e2e8f0', // slate-200

                // Fondo de los inputs (gris azulado claro en vez de blanco encandilante)
                inputBackgroundColor: '#f1f5f9', // slate-100

                // Bordes bien definidos pero limpios
                outlineSecondaryColor: '#64748b', // slate-500
                inputBorderWidth: '1px',

                // Textos para asegurar buena legibilidad sobre el nuevo fondo
                textPrimaryColor: '#0f172a', // slate-900 (texto principal al escribir)
                textSecondaryColor: '#475569', // slate-600 (labels, subtítulos y placeholders)

                // Botón principal
                baseColor: '#2563eb', // blue-600
            },
        },
    },
    paymentMethods: {
        ticket: 'all',
        creditCard: 'all',
        prepaidCard: 'all',
        debitCard: 'all',
    },
};

export default function PaymentBrick() {
    const router = useRouter();
    const [paymentError, setPaymentError] = useState('');
    const { items } = useCart();
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

    // El Brick muestra el total del carrito; la API lo recalcula antes de crear la orden.
    const initialization: PaymentInitialization = { amount };
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <main className='flex min-h-dvh flex-col bg-slate-500 px-4 py-6 sm:px-6'>
            <div className='mx-auto my-auto w-full max-w-2xl'>
                <div className='mb-6 text-slate-100'>
                    <Link
                        href='/options'
                        className='text-sm font-medium text-blue-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400'
                    >
                        Volver a las opciones
                    </Link>
                    <h1 className='mt-4 text-xl font-semibold'>Pagar tu carrito</h1>
                    <p className='mt-1 text-sm text-slate-300'>
                        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}. Total: {formatPrice(amount)}
                    </p>
                </div>
                <div className='bg-slate-00 rounded-2xl border border-slate-500'>
                    <Payment
                        initialization={initialization}
                        customization={CUSTOMIZATION}
                        onSubmit={async (formData) => {
                            // Al confirmar, enviamos los datos del Brick a nuestra API para crear la orden.
                            setPaymentError('');
                            try {
                                const order = await createCheckoutApiOrder({ items, paymentData: formData });
                                router.push(`/order-status?order_id=${encodeURIComponent(order.id)}`);
                            } catch (error) {
                                console.error('Error:', error);
                                setPaymentError('No pudimos confirmar el resultado del pago. Revisá el estado de la operación en Mercado Pago antes de volver a pagar.');
                                throw error;
                            }
                        }}
                        
                    />
                </div>
                {paymentError ? <p role='alert' className='mt-4 rounded-lg border border-red-300 bg-slate-900 p-4 text-red-200'>{paymentError}</p> : null}
            </div>
        </main>
    );
}
