import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import { Product } from '../types/tpv';
import { calcPvpWithVat, formatCurrency } from '../utils/formatters';

export interface ActiveUpsellPrompt {
  sourceProductName: string;
  targetProduct: Product;
  quantity: number;
  message: string;
}

interface UpsellBannerProps {
  prompt: ActiveUpsellPrompt | null;
  onAccept: (prompt: ActiveUpsellPrompt) => void;
  onDismiss: () => void;
}

export const UpsellBanner: React.FC<UpsellBannerProps> = ({
  prompt,
  onAccept,
  onDismiss,
}) => {
  if (!prompt) return null;

  const totalPvp =
    calcPvpWithVat(prompt.targetProduct.priceExclVat) * prompt.quantity;

  return (
    <div className="mb-3 flex flex-col justify-between gap-3 rounded-2xl border border-blue-800/60 bg-gradient-to-r from-blue-950/60 via-zinc-900 to-zinc-900 p-3.5 shadow-lg sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-800/60 bg-blue-950/60 text-blue-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
              Complemento Recomendado
            </span>
            <span className="text-xs text-zinc-400">
              al añadir {prompt.sourceProductName}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-zinc-100">
            {prompt.message}
          </p>
          <p className="mt-0.5 text-xs text-zinc-300">
            Complemento:{' '}
            <strong className="text-blue-300">
              {prompt.quantity}× {prompt.targetProduct.name}
            </strong>{' '}
            ({formatCurrency(totalPvp)} PVP IVA inc.)
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onAccept(prompt)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>
            Añadir ({prompt.quantity} ud{prompt.quantity > 1 ? 's' : ''})
          </span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar sugerencia"
          className="rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
