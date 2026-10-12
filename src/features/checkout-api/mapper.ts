import type { CheckoutApiPaymentData, MercadoPagoOrderBody, OrderData } from '@/types/mercadopago.types';

export function mapPaymentDataToOrder(paymentData: CheckoutApiPaymentData, orderData: OrderData): MercadoPagoOrderBody {
    const { formData, paymentType } = paymentData;
    const amount = orderData.amount.toFixed(2);

    return {
        type: 'online',
        processing_mode: 'automatic',
        total_amount: amount,
        external_reference: orderData.externalReference,
        payer: formData.payer,
        transactions: {
            payments: [
                {
                    amount,
                    payment_method: {
                        id: formData.payment_method_id,
                        type: paymentType,
                        token: formData.token,
                        installments: formData.installments,
                    },
                },
            ],
        },
    };
}
