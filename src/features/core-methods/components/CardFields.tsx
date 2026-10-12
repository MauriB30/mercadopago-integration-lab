import { CardNumber, ExpirationDate, SecurityCode } from '@mercadopago/sdk-react';
import type { ComponentProps } from 'react';
import type { useCardPayment } from '../hooks/useCardPayment';

type Props = ReturnType<typeof useCardPayment>['cardFields'];

const FIELD_STYLE: ComponentProps<typeof CardNumber>['style'] = {
    color: '#f1f5f9',
    placeholderColor: '#94a3b8',
    fontSize: '16px',
    height: '48px',
};

export default function CardFields({
    paymentMethod,
    installments,
    selectedInstallments,
    handleBinChange,
    handleInstallmentsChange,
}: Props) {
    return (
        <>
            {/* Estos componentes montan campos seguros de MP, no inputs propios para los datos de tarjeta. */}
            <fieldset>
                <legend className='mb-2 text-sm font-medium'>Número de tarjeta</legend>
                <div className='h-12 rounded-lg border border-slate-500 bg-slate-900 px-3 focus-within:border-blue-300'>
                    <CardNumber placeholder='0000 0000 0000 0000' style={FIELD_STYLE} onBinChange={handleBinChange} />
                </div>
                {paymentMethod ? <p className='mt-2 text-sm text-slate-300'>Tarjeta: {paymentMethod.name}</p> : null}
            </fieldset>

            <div className='grid gap-5 sm:grid-cols-2'>
                <fieldset className='min-w-0'>
                    <legend className='mb-2 text-sm font-medium'>Vencimiento</legend>
                    <div className='h-12 rounded-lg border border-slate-500 bg-slate-900 px-3 focus-within:border-blue-300'>
                        <ExpirationDate placeholder='MM/AA' mode='short' style={FIELD_STYLE} />
                    </div>
                </fieldset>
                <fieldset className='min-w-0'>
                    <legend className='mb-2 text-sm font-medium'>Código de seguridad</legend>
                    <div className='h-12 rounded-lg border border-slate-500 bg-slate-900 px-3 focus-within:border-blue-300'>
                        <SecurityCode placeholder='CVV' style={FIELD_STYLE} />
                    </div>
                </fieldset>
            </div>

            <div>
                <label htmlFor='installments' className='mb-2 block text-sm font-medium'>Cuotas</label>
                <select
                    id='installments'
                    value={selectedInstallments}
                    onChange={handleInstallmentsChange}
                    disabled={installments.length === 0}
                    className='min-h-12 w-full rounded-lg border border-slate-500 bg-slate-900 px-3 text-base text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60'
                >
                    <option value=''>Elegí las cuotas</option>
                    {installments.map((option) => (
                        <option key={option.installments} value={option.installments}>
                            {option.recommended_message}
                        </option>
                    ))}
                </select>
                {installments.length === 0 ? <p className='mt-2 text-sm text-slate-300'>Ingresá una tarjeta válida para consultar las cuotas disponibles.</p> : null}
            </div>

        </>
    );
}
