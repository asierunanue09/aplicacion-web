import React, { useEffect, useState } from 'react';
import {
  Banknote,
  CreditCard,
  Landmark,
  X,
  CheckCircle2,
  AlertCircle,
  Wifi,
  ShieldCheck,
  Loader2,
  Cpu,
  Receipt,
} from 'lucide-react';
import {
  CardTerminalAuth,
  PaymentMethod,
  TicketTotals,
} from '../types/tpv';
import { formatCurrency, roundMoney } from '../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  totals: TicketTotals;
  customerLabel: string;
  plateLabel: string;
  onClose: () => void;
  onConfirmSale: (
    method: PaymentMethod,
    amountTendered?: number,
    changeDue?: number,
    cardAuth?: CardTerminalAuth
  ) => void;
}

type TerminalStep = 'ready' | 'connecting' | 'authorizing' | 'approved';

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'tarjeta',
    label: 'Datáfono / Tarjeta',
    desc: 'Terminal TPV Contactless · Chip',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'efectivo',
    label: 'Efectivo en Caja',
    desc: 'Billetes rápidos y cambio',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    id: 'transferencia',
    label: 'Transferencia',
    desc: 'IBAN / Flotas B2B',
    icon: <Landmark className="h-5 w-5" />,
  },
];

const QUICK_CASH_BILLS = [10, 20, 50, 100, 200];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  totals,
  customerLabel,
  plateLabel,
  onClose,
  onConfirmSale,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('tarjeta');
  const [cashInput, setCashInput] = useState<string>(
    totals.totalPvp.toFixed(2)
  );
  const [terminalStep, setTerminalStep] = useState<TerminalStep>('ready');
  const [entryMode, setEntryMode] = useState<'Contactless NFC' | 'Chip EMV'>(
    'Contactless NFC'
  );
  const [cardBrand, setCardBrand] = useState<'VISA' | 'MASTERCARD'>('VISA');
  const [generatedAuth, setGeneratedAuth] = useState<CardTerminalAuth | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setMethod('tarjeta');
      setCashInput(totals.totalPvp.toFixed(2));
      setTerminalStep('ready');
      setGeneratedAuth(null);
    }
  }, [isOpen, totals.totalPvp]);

  if (!isOpen) return null;

  const parsedCash = Number(cashInput.replace(',', '.'));
  const isCashValid =
    method !== 'efectivo' ||
    (Number.isFinite(parsedCash) && parsedCash >= totals.totalPvp);
  const changeDue =
    method === 'efectivo' && Number.isFinite(parsedCash)
      ? roundMoney(Math.max(0, parsedCash - totals.totalPvp))
      : 0;

  const startTerminalPayment = (selectedEntry: 'Contactless NFC' | 'Chip EMV') => {
    if (terminalStep !== 'ready') return;
    setEntryMode(selectedEntry);
    setTerminalStep('connecting');

    window.setTimeout(() => {
      setTerminalStep('authorizing');
    }, 650);

    window.setTimeout(() => {
      const randomLast4 = String(Math.floor(1000 + Math.random() * 9000));
      const randomAuth = String(Math.floor(100000 + Math.random() * 899999));
      const auth: CardTerminalAuth = {
        brand: cardBrand,
        last4: randomLast4,
        authCode: randomAuth,
        terminalId: 'TPV-ES-04829',
        entryMode: selectedEntry,
      };
      setGeneratedAuth(auth);
      setTerminalStep('approved');
    }, 1500);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'tarjeta') {
      if (terminalStep !== 'approved' || !generatedAuth) return;
      onConfirmSale('tarjeta', totals.totalPvp, 0, generatedAuth);
      return;
    }
    if (!isCashValid) return;
    if (method === 'efectivo') {
      onConfirmSale('efectivo', roundMoney(parsedCash), changeDue);
    } else {
      onConfirmSale('transferencia');
    }
  };

  const addCashBill = (bill: number) => {
    const current = Number(cashInput.replace(',', '.'));
    const base = Number.isFinite(current) && current !== totals.totalPvp ? current : 0;
    setCashInput((base + bill).toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-white">
              Terminal de Cobro · Caja TPV
            </h3>
            <p className="text-xs text-zinc-400">
              {customerLabel || 'Cliente Mostrador'}
              {plateLabel ? ` · Matrícula ${plateLabel}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 p-5">
          {/* Resumen importe */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-800/60 bg-blue-950/50 px-4 py-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Total a Cobrar (IVA 21% inc.)
              </span>
              <p className="text-xs text-zinc-300 tabular-nums">
                Base: {formatCurrency(totals.taxableBase)} · IVA:{' '}
                {formatCurrency(totals.vatAmount)}
              </p>
            </div>
            <p className="text-3xl font-black text-white tabular-nums">
              {formatCurrency(totals.totalPvp)}
            </p>
          </div>

          {/* Métodos de pago */}
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = method === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMethod(opt.id);
                    setTerminalStep('ready');
                    setGeneratedAuth(null);
                    if (opt.id === 'efectivo') {
                      setCashInput(totals.totalPvp.toFixed(2));
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                    active
                      ? 'border-blue-700 bg-blue-950/60 text-white shadow-sm'
                      : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div className="text-xs font-bold leading-tight">
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SIMULADOR DE DATÁFONO / TERMINAL DE PAGO */}
          {method === 'tarjeta' && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-inner">
              <div className="mb-3 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-mono-tech flex items-center gap-1.5 font-bold text-zinc-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  DATÁFONO TPV-ES-04829
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={terminalStep !== 'ready'}
                    onClick={() => setCardBrand('VISA')}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      cardBrand === 'VISA'
                        ? 'bg-blue-700 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    VISA
                  </button>
                  <button
                    type="button"
                    disabled={terminalStep !== 'ready'}
                    onClick={() => setCardBrand('MASTERCARD')}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      cardBrand === 'MASTERCARD'
                        ? 'bg-zinc-200 text-zinc-900'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    MASTERCARD
                  </button>
                </div>
              </div>

              {/* Pantalla LCD del Datáfono */}
              <div className="rounded-xl border-2 border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 text-center">
                {terminalStep === 'ready' && (
                  <div className="space-y-2 py-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/50 text-blue-300">
                      <Wifi className="h-6 w-6 rotate-90" />
                    </div>
                    <p className="font-mono-tech text-xs font-bold uppercase tracking-wider text-blue-300">
                      TERMINAL LISTO · IMPORTE
                    </p>
                    <p className="text-2xl font-black text-white tabular-nums">
                      {formatCurrency(totals.totalPvp)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Acerque tarjeta / móvil (Contactless) o inserte Chip EMV
                    </p>
                  </div>
                )}

                {terminalStep === 'connecting' && (
                  <div className="space-y-2 py-4">
                    <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-400" />
                    <p className="font-mono-tech text-xs font-bold text-blue-300">
                      LEYENDO {entryMode.toUpperCase()}...
                    </p>
                    <p className="text-xs text-zinc-400">
                      Estableciendo enlace cifrado con pasarela bancaria
                    </p>
                  </div>
                )}

                {terminalStep === 'authorizing' && (
                  <div className="space-y-2 py-4">
                    <Loader2 className="mx-auto h-9 w-9 animate-spin text-zinc-300" />
                    <p className="font-mono-tech text-xs font-bold text-zinc-200">
                      SOLICITANDO AUTORIZACIÓN {cardBrand}...
                    </p>
                    <p className="text-xs text-zinc-400">
                      Verificando fondos y firma EMV
                    </p>
                  </div>
                )}

                {terminalStep === 'approved' && generatedAuth && (
                  <div className="space-y-2 py-2">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                    <p className="font-mono-tech text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                      OPERACIÓN APROBADA
                    </p>
                    <div className="font-mono-tech mx-auto max-w-xs rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                      <div>
                        {generatedAuth.brand} **** {generatedAuth.last4} ·{' '}
                        {generatedAuth.entryMode}
                      </div>
                      <div>CÓDIGO AUT: {generatedAuth.authCode}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones físicos del Datáfono */}
              {terminalStep === 'ready' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startTerminalPayment('Contactless NFC')}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-600"
                  >
                    <Wifi className="h-4 w-4 rotate-90" />
                    <span>Cobrar Contactless</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startTerminalPayment('Chip EMV')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-bold text-zinc-100 transition hover:bg-zinc-700"
                  >
                    <Cpu className="h-4 w-4 text-zinc-300" />
                    <span>Insertar Chip EMV</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CAJA EFECTIVO */}
          {method === 'efectivo' && (
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CASH_BILLS.map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => addCashBill(bill)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:border-emerald-500/50 hover:bg-zinc-800"
                  >
                    +{bill} €
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashInput(totals.totalPvp.toFixed(2))}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700"
                >
                  Exacto
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-zinc-300">
                  Efectivo entregado (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  className="w-36 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-right text-base font-extrabold text-white tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-sm">
                <span className="text-zinc-400">Cambio a devolver:</span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">
                  {formatCurrency(changeDue)}
                </span>
              </div>

              {!isCashValid && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>El importe entregado debe cubrir el total de la venta.</span>
                </div>
              )}
            </div>
          )}

          {/* TRANSFERENCIA BANCARIA */}
          {method === 'transferencia' && (
            <div className="space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs">
              <div className="font-bold text-zinc-200">
                Cuenta TallerTPV Recambios S.L.
              </div>
              <div className="font-mono-tech text-blue-300">
                IBAN: ES84 0049 1500 0512 3456 7890
              </div>
              <p className="text-zinc-400">
                Concepto recomendado:{' '}
                <strong className="text-zinc-200">
                  {plateLabel || customerLabel || 'VENTA MOSTRADOR'}
                </strong>
              </p>
            </div>
          )}

          {/* Pie de acciones */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                (method === 'tarjeta' && terminalStep !== 'approved') ||
                (method === 'efectivo' && !isCashValid)
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Receipt className="h-4 w-4" />
              <span>Emitir Ticket y Descontar Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
