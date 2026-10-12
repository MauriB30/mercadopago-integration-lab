import { DEMO_PRODUCTS } from '@/features/cart/catalog';
import type { CartItem, OrderData, MercadoPagoOrderBody } from '@/types/mercadopago.types';

export function mapCheckoutProToOrder(items: CartItem[], orderData: OrderData): MercadoPagoOrderBody {
    return {
        type: 'online',
        processing_mode: 'manual',
        total_amount: orderData.amount.toFixed(2),
        external_reference: orderData.externalReference,
        config: {
            online: {
                success_url: orderData.returnUrl,
                failure_url: orderData.returnUrl,
                pending_url: orderData.returnUrl,
                auto_return: 'approved',
            },
        },
        items: items.map((item) => {
            // La ruta valida el carrito antes de llamar a este mapper.
            const product = DEMO_PRODUCTS.find((candidate) => candidate.id === item.productId)!;

            return {
                external_code: product.id,
                title: product.name,
                quantity: item.quantity,
                unit_price: product.price.toFixed(2),
            };
        }),
    };
}

