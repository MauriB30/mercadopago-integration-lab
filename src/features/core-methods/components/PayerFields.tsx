import type { useCardPayment } from '../hooks/useCardPayment';

type Props = ReturnType<typeof useCardPayment>['payerFields'];

export default function PayerFields({
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
}: Props) {
    return (
        <>
            <div>
                <label htmlFor='identification-type' className='mb-2 block text-sm font-medium'>Tipo de documento</label>
                <select
                    id='identification-type'
                    value={selectedIdentificationType}
                    onChange={handleIdentificationTypeChange}
                    disabled={identificationTypes.length === 0}
                    className='min-h-12 w-full rounded-lg border border-slate-500 bg-slate-900 px-3 text-base text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60'
                >
                    <option value=''>Elegí el tipo de documento</option>
                    {identificationTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                {identificationError ? <p role='alert' className='mt-2 text-sm text-red-300'>No pudimos cargar los tipos de documento. Recargá la página para reintentar.</p> : null}
            </div>

            <div>
                <label htmlFor='cardholder-name' className='mb-2 block text-sm font-medium'>Nombre del titular</label>
                <input
                    id='cardholder-name'
                    type='text'
                    autoComplete='cc-name'
                    placeholder='Como figura en la tarjeta'
                    value={cardholderName}
                    onChange={handleCardholderNameChange}
                    className='min-h-12 w-full rounded-lg border border-slate-500 bg-slate-900 px-3 text-base text-slate-100 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300'
                />
            </div>

            <div>
                <label htmlFor='identification-number' className='mb-2 block text-sm font-medium'>Número de documento</label>
                <input
                    id='identification-number'
                    type='text'
                    placeholder='Sin puntos ni espacios'
                    value={identificationNumber}
                    onChange={handleIdentificationNumberChange}
                    className='min-h-12 w-full rounded-lg border border-slate-500 bg-slate-900 px-3 text-base text-slate-100 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300'
                />
            </div>

            <div>
                <label htmlFor='payer-email' className='mb-2 block text-sm font-medium'>Email</label>
                <input
                    id='payer-email'
                    type='email'
                    autoComplete='email'
                    placeholder='ejemplo@email.com'
                    value={email}
                    onChange={handleEmailChange}
                    className='min-h-12 w-full rounded-lg border border-slate-500 bg-slate-900 px-3 text-base text-slate-100 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300'
                />
            </div>

        </>
    );
}
