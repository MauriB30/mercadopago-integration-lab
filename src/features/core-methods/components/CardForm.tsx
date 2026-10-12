'use client';

import type { CartItem } from '@/types/mercadopago.types';
import { useCardPayment } from '../hooks/useCardPayment';
import CardFields from './CardFields';
import PayerFields from './PayerFields';

export default function CardForm({ amount, items }: { amount: number; items: CartItem[] }) {
    const { cardFields, payerFields, handlePay, isPaying, paymentError } = useCardPayment({ amount, items });

    return (
        <div className='space-y-5'>
            <CardFields {...cardFields} />
            <PayerFields {...payerFields} />

            <button
                type='button'
                onClick={handlePay}
                disabled={isPaying}
                className='min-h-12 w-full rounded-lg bg-blue-600 px-4 font-medium text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60'
            >
                {isPaying ? 'Procesando pago…' : 'Pagar'}
            </button>
            {paymentError ? (
                <p role='alert' className='text-sm text-red-300'>
                    {paymentError}
                </p>
            ) : null}

            <p className='text-sm leading-6 text-slate-300'>
                Usá únicamente datos de prueba. Al apretar Pagar generamos el token y solicitamos el pago a través de nuestro backend.
            </p>
        </div>
    );
}
