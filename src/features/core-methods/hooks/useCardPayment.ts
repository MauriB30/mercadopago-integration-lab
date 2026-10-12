'use client';

import { createCheckoutApiOrder } from '@/features/checkout-api/service';
import type { CartItem } from '@/types/mercadopago.types';
import { createCardToken, getIdentificationTypes, getInstallments, getPaymentMethods } from '@mercadopago/sdk-react';
import type { IdentificationType } from '@mercadopago/sdk-react/esm/coreMethods/getIdentificationTypes/types';
import type { Result } from '@mercadopago/sdk-react/esm/coreMethods/getPaymentMethods/types';
import type { PayerCost } from '@mercadopago/sdk-react/esm/coreMethods/util/types';
import type { BinChangeArg } from '@mercadopago/sdk-react/esm/secureFields/util/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';

export function useCardPayment({ amount, items }: { amount: number; items: CartItem[] }) {
    const router = useRouter();
    // Estado del formulario y de la operación.
    const [paymentMethod, setPaymentMethod] = useState<Result>();
    const [installments, setInstallments] = useState<PayerCost[]>([]);
    const [selectedInstallments, setSelectedInstallments] = useState<number | ''>('');
    const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);
    const [selectedIdentificationType, setSelectedIdentificationType] = useState('');
    const [identificationError, setIdentificationError] = useState(false);
    const [cardholderName, setCardholderName] = useState('');
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [email, setEmail] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [isPaying, setIsPaying] = useState(false);

    // Consultamos los documentos al montar el formulario.
    useEffect(() => {
        let active = true;

        async function loadIdentificationTypes() {
            try {
                const response = await getIdentificationTypes();
                if (active) {
                    setIdentificationTypes(response ?? []);
                    setIdentificationError(!response?.length);
                }
            } catch {
                if (active) setIdentificationError(true);
            }
        }

        loadIdentificationTypes();
        return () => {
            active = false;
        };
    }, []);

    // Detectamos la tarjeta y consultamos sus cuotas sin reiniciar el campo seguro.
    const handleBinChange = useCallback(
        async (data: BinChangeArg) => {
            setSelectedInstallments('');
            setInstallments([]);
            if (data.bin) {
                const PaymentMethodsresponse = await getPaymentMethods({ bin: data.bin });
                const results = PaymentMethodsresponse?.results[0];
                setPaymentMethod(results);
                const installmentsResponse = await getInstallments({ amount: amount.toString(), bin: data.bin });
                setInstallments(installmentsResponse?.[0]?.payer_costs ?? []);
                return;
            }

            setPaymentMethod(undefined);
            setInstallments([]);
        },
        [amount]
    );

    function handleInstallmentsChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedInstallments(event.target.value === '' ? '' : Number(event.target.value));
    }

    function handleIdentificationTypeChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedIdentificationType(event.target.value);
    }

    function handleCardholderNameChange(event: ChangeEvent<HTMLInputElement>) {
        setCardholderName(event.target.value);
    }

    function handleIdentificationNumberChange(event: ChangeEvent<HTMLInputElement>) {
        setIdentificationNumber(event.target.value);
    }

    function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value);
    }

    // Tokenizamos, creamos la orden y navegamos a su estado.
    async function handlePay() {
        if (isPaying) return;
        setPaymentError('');

        if (
            !cardholderName.trim() ||
            !selectedIdentificationType ||
            !identificationNumber.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            setPaymentError('Completá los datos del titular, el documento y un email válido.');
            return;
        }

        if (!paymentMethod || !selectedInstallments) {
            setPaymentError('Ingresá una tarjeta y elegí las cuotas antes de pagar.');
            return;
        }

        setIsPaying(true);
        try {
            const token = await createCardToken({
                cardholderName: cardholderName.trim(),
                identificationType: selectedIdentificationType,
                identificationNumber: identificationNumber.trim(),
            });
            if (!token?.id) {
                setPaymentError('Mercado Pago no devolvió un token. Revisá los datos e intentá nuevamente.');
                return;
            }

            // Armamos el mismo formato que entrega el Brick para reutilizar su backend.
            const order = await createCheckoutApiOrder({
                items,
                paymentData: {
                    paymentType: paymentMethod.payment_type_id,
                    selectedPaymentMethod: paymentMethod.payment_type_id,
                    formData: {
                        token: token.id,
                        payment_method_id: paymentMethod.id,
                        installments: selectedInstallments,
                        payer: {
                            email: email.trim(),
                            identification: {
                                type: selectedIdentificationType,
                                number: identificationNumber.trim(),
                            },
                        },
                    },
                },
            });

            router.push(`/order-status?order_id=${encodeURIComponent(order.id)}`);
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'No pudimos completar el pago.');
        } finally {
            setIsPaying(false);
        }
    }

    return {
        cardFields: {
            paymentMethod,
            installments,
            selectedInstallments,
            handleBinChange,
            handleInstallmentsChange,
        },
        payerFields: {
            identificationTypes,
            selectedIdentificationType,
            identificationError,
            cardholderName,
            identificationNumber,
            email,
            handleIdentificationTypeChange,
            handleCardholderNameChange,
            handleIdentificationNumberChange,
            handleEmailChange,
        },
        handlePay,
        isPaying,
        paymentError,
    };
}
