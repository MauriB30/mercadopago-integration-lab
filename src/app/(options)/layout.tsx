'use client';

import { initMercadoPago } from '@mercadopago/sdk-react';
import type { ReactNode } from 'react';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

if (PUBLIC_KEY) {
    initMercadoPago(PUBLIC_KEY, { locale: 'es-AR' });
}

export default function OptionsLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
