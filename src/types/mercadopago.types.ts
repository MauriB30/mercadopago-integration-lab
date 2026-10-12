import type { Order } from 'mercadopago';

/** Formato compartido: lo entrega el Payment Brick o lo arma el formulario personalizado. */
export type CheckoutApiPaymentData = {
    paymentType: string;
    selectedPaymentMethod: string;
    formData: {
        token: string;
        payment_method_id: string;
        installments: number;
        payer: {
            email: string;
            identification?: {
                type?: string;
                number?: string;
            };
        };
    };
};

/** Datos enviados a la ruta compartida de Checkout API: carrito y datos del pago. */
export type CreateOrderRequest = {
    items: CartItem[];
    paymentData: CheckoutApiPaymentData;
};

/** Producto y cantidad guardados en el carrito de esta práctica. */
export type CartItem = {
    productId: string;
    quantity: number;
};

/** Datos propios de la orden que el backend agrega antes de enviarla a Mercado Pago. */
export type OrderData = {
    amount: number;
    externalReference: string;
    returnUrl?: string;
};

/** Cuerpo que acepta order.create; compartido por los mappers de ambas integraciones. */
export type MercadoPagoOrderBody = Parameters<Order['create']>[0]['body'];
