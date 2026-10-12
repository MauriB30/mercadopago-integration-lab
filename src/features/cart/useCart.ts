'use client';

import { calculateCartAmount, DEMO_PRODUCTS } from '@/features/cart/catalog';
import type { CartItem } from '@/types/mercadopago.types';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'practica-mp-cart-v1';
const CART_UPDATED = 'practica-mp-cart-updated';
let memoryCart = '[]';

function subscribe(callback: () => void) {
    const onStorage = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
            memoryCart = event.newValue ?? '[]';
            callback();
        }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(CART_UPDATED, callback);

    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener(CART_UPDATED, callback);
    };
}

function getSnapshot() {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? memoryCart;
    } catch {
        return memoryCart;
    }
}

function readCart(raw: string): CartItem[] {
    try {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && (saved.length === 0 || calculateCartAmount(saved) !== null)) {
            return saved;
        }
    } catch {
        // Si el almacenamiento contiene datos inválidos, comenzamos vacío.
    }

    return [];
}

export function useCart() {
    const raw = useSyncExternalStore<string | null>(subscribe, getSnapshot, () => null);
    const items = raw === null ? null : readCart(raw);

    function updateQuantity(productId: string, quantity: number) {
        if (items === null || !DEMO_PRODUCTS.some((product) => product.id === productId)) {
            return;
        }

        const nextQuantity = Math.max(0, Math.min(10, quantity));
        const next = items.filter((item) => item.productId !== productId);
        if (nextQuantity > 0) {
            next.push({ productId, quantity: nextQuantity });
        }

        memoryCart = JSON.stringify(next);
        try {
            localStorage.setItem(STORAGE_KEY, memoryCart);
        } catch {
            // El carrito sigue funcionando en esta pestaña aunque no pueda persistirse.
        }
        window.dispatchEvent(new Event(CART_UPDATED));
    }

    return { items, updateQuantity };
}
