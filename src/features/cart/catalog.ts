import type { CartItem } from '@/types/mercadopago.types';

// Catálogo simulado: en una tienda real, estos datos vendrían de una base de datos.
export const DEMO_PRODUCTS = [
    {
        id: 'cuaderno-a5',
        name: 'Cuaderno A5',
        description: 'Tapa dura azul, para notas y bocetos.',
        price: 100,
        image: '/products/cuaderno.png',
    },
    {
        id: 'taza-termica',
        name: 'Taza térmica',
        description: 'Para acompañar una jornada de trabajo.',
        price: 250,
        image: '/products/taza.png',
    },
    {
        id: 'lampara-escritorio',
        name: 'Lámpara de escritorio',
        description: 'Luz puntual para tu espacio de trabajo.',
        price: 500,
        image: '/products/lampara.png',
    },
] as const;

const priceFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
});

export function formatPrice(amount: number) {
    return priceFormatter.format(amount);
}

// El servidor usa este cálculo y rechaza IDs o cantidades que no pertenezcan al catálogo.
export function calculateCartAmount(items: unknown): number | null {
    if (!Array.isArray(items) || items.length === 0 || items.length > DEMO_PRODUCTS.length) {
        return null;
    }

    let total = 0;
    const seen = new Set<string>();

    for (const item of items as CartItem[]) {
        if (!item || typeof item.productId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10 || seen.has(item.productId)) {
            return null;
        }

        const product = DEMO_PRODUCTS.find((candidate) => candidate.id === item.productId);
        if (!product) {
            return null;
        }

        seen.add(item.productId);
        total += product.price * item.quantity;
    }

    return total;
}
