import { formatPrice } from '@/features/cart/catalog';
import { order } from '@/lib/mercadopago';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type Props = {
    searchParams: Promise<{ order_id?: string; payment_id?: string; status?: string }>;
};

const CARD_LABELS: Record<string, string> = {
    master: 'Mastercard',
    visa: 'Visa',
    amex: 'American Express',
    account_money: 'Dinero en cuenta de Mercado Pago',
};

function StatusNotice({ title, message, href, label }: { title: string; message: string; href: string; label: string }) {
    return (
        <main className='flex min-h-dvh items-center justify-center bg-slate-900 px-4 py-10 text-slate-100 sm:px-6'>
            <section className='w-full max-w-xl rounded-2xl border border-slate-600 bg-slate-800 p-6 sm:p-8'>
                <h1 className='text-2xl font-semibold'>{title}</h1>
                <p className='mt-3 leading-7 text-slate-300'>{message}</p>
                <a href={href} className='mt-8 inline-flex min-h-11 items-center rounded-lg border border-slate-500 px-5 font-medium hover:border-blue-300 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400'>
                    {label}
                </a>
            </section>
        </main>
    );
}

/** Consulta la orden y devuelve null si falla. */
async function fetchOrderSafely(orderId: string) {
    try {
        return await order.get({ id: orderId });
    } catch (error) {
        console.error('Error al consultar la orden:', error);
        return null;
    }
}

export default async function OrderStatusPage({ searchParams }: Props) {
    const { order_id: orderId, payment_id: paymentId, status } = await searchParams;

    // Checkout Pro devuelve estos valores como texto al volver sin pagar.
    if (paymentId === 'null' && status === 'null') {
        redirect('/options');
    }

    if (!orderId) {
        return <StatusNotice title='No se recibió una orden' message='Falta el ID para consultar el estado de tu compra.' href='/options' label='Volver a las opciones' />;
    }

    const statusUrl = `/order-status?order_id=${encodeURIComponent(orderId)}`;
    const orderStatus = await fetchOrderSafely(orderId);

    if (!orderStatus) {
        return <StatusNotice title='No pudimos consultar el resultado' message='Esto no significa que el pago haya sido rechazado. Consultá nuevamente antes de intentar otro pago.' href={statusUrl} label='Volver a consultar' />;
    }

    if (orderStatus.status === 'processing' || (orderStatus.status === 'action_required' && orderStatus.status_detail === 'waiting_retry')) {
        return <StatusNotice title='Tu pago está en proceso' message='Todavía no hay un resultado definitivo. No vuelvas a pagar; esperá y consultá nuevamente en unos minutos.' href={statusUrl} label='Actualizar estado' />;
    }

    if (orderStatus.status === 'failed') {
        return <StatusNotice title='No se pudo completar el pago' message='El intento de pago falló. Podés volver a las opciones e intentar con otro medio de pago.' href='/options' label='Volver a las opciones de pago' />;
    }

    if (orderStatus.status !== 'processed' || orderStatus.status_detail !== 'accredited') {
        return <StatusNotice title='Estado de tu compra' message='La orden tiene un estado que este ejemplo no desarrolla. Esto no confirma un pago aprobado ni rechazado. No realices otro pago sin verificar el resultado.' href={statusUrl} label='Volver a consultar' />;
    }

    const paymentMethod = orderStatus.transactions?.payments?.[0]?.payment_method;
    const cardLabel = CARD_LABELS[paymentMethod?.id ?? ''] ?? 'Tarjeta';
    const paidAmount = formatPrice(Number(orderStatus.total_paid_amount));
    const operationDate = orderStatus.created_date
        ? new Date(orderStatus.created_date).toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'America/Argentina/Buenos_Aires',
        })
        : null;

    return (
        <main className='flex min-h-dvh items-center justify-center bg-slate-900 px-4 py-10 text-slate-100 sm:px-6'>
            <section className='w-full max-w-xl rounded-2xl border border-slate-600 bg-slate-800 p-6 sm:p-8'>
                <h1 className='text-2xl font-semibold text-emerald-300 sm:text-3xl'>¡Pago aprobado!</h1>
                <p className='mt-3 leading-7 text-slate-300'>Tu pago se completó correctamente. Gracias por tu compra.</p>

                <div className='mt-8 rounded-xl bg-slate-900/60 p-5'>
                    <p className='text-sm text-slate-300'>Total pagado</p>
                    <p className='mt-2 text-3xl font-semibold tabular-nums'>{paidAmount}</p>
                </div>

                <div className='mt-6 space-y-3 border-t border-slate-600 pt-5 text-slate-300'>
                    <p>Medio de pago: {cardLabel}</p>
                    {paymentMethod?.installments ? <p>Cuotas: {paymentMethod.installments}</p> : null}
                    {operationDate ? <p>Fecha: {operationDate}</p> : null}
                    <p className='break-all text-sm'>Referencia: {orderId}</p>
                </div>

                <Link
                    href='/'
                    className='mt-8 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-500 px-5 font-medium text-slate-100 hover:border-blue-300 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400'
                >
                    Volver a la tienda
                </Link>
            </section>
        </main>
    );
}
