import React, { useState } from 'react';
import {
  Droplets,
  CircleDot,
  Cog,
  Disc,
  Plus,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Product, ProductCategory } from '../types/tpv';
import {
  calcPvpWithVat,
  formatCurrency,
  getCategoryMeta,
  getStockStatus,
} from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  quantityInTicket: number;
  onAddProduct: (product: Product, withTireService?: boolean) => void;
}

function CategoryVisualBadge({ category }: { category: ProductCategory }) {
  const iconClass = 'h-6 w-6';
  switch (category) {
    case 'fluidos':
      return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-zinc-300">
          <Droplets className={iconClass} />
        </div>
      );
    case 'neumaticos':
      return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-zinc-300">
          <CircleDot className={iconClass} />
        </div>
      );
    case 'embragues':
      return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-zinc-300">
          <Cog className={iconClass} />
        </div>
      );
    case 'frenado':
      return (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/70 text-blue-300">
          <Disc className={iconClass} />
        </div>
      );
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInTicket,
  onAddProduct,
}) => {
  const [imgError, setImgError] = useState(false);
  const catMeta = getCategoryMeta(product.category);
  const stockInfo = getStockStatus(product);
  const pvp = calcPvpWithVat(product.priceExclVat);
  const isTireProduct = product.category === 'neumaticos' && !product.isService;

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/30">
      <div>
        {/* Cabecera tarjeta: Miniatura foto producto + Marca + Estado stock */}
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3">
            {product.imageUrl && !imgError ? (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-inner">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <CategoryVisualBadge category={product.category} />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-zinc-200">
                  {product.brand}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${catMeta.badgeBgClass}`}
                >
                  {catMeta.shortLabel}
                </span>
              </div>
              {product.tireSize && (
                <div className="font-mono-tech mt-1 inline-block rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-[11px] font-bold text-zinc-200">
                  {product.tireSize}
                </div>
              )}
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stockInfo.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stockInfo.dotClass}`} />
            {stockInfo.label}
          </span>
        </div>

        {/* Nombre técnico */}
        <h3 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-zinc-100 group-hover:text-white sm:text-[15px]">
          {product.name}
        </h3>
        <p className="mb-3 line-clamp-2 text-xs text-zinc-400">
          {product.shortDesc}
        </p>

        {/* Referencias OEM y Aftermarket en negrita */}
        <div className="mb-3.5 grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Ref. OEM
            </span>
            <span
              className="font-mono-tech block truncate font-bold text-zinc-100"
              title={product.oemRef}
            >
              {product.oemRef}
            </span>
          </div>
          <div className="min-w-0 border-l border-zinc-800 pl-2">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Aftermarket
            </span>
            <span
              className="font-mono-tech block truncate font-bold text-blue-300"
              title={product.aftermarketRef}
            >
              {product.aftermarketRef}
            </span>
          </div>
        </div>
      </div>

      {/* Pie tarjeta: Precios + Acciones */}
      <div className="border-t border-zinc-800/80 pt-3">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <span className="block text-[11px] text-zinc-400">
              Sin IVA:{' '}
              <strong className="font-semibold text-zinc-200 tabular-nums">
                {formatCurrency(product.priceExclVat)}
              </strong>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white tabular-nums">
                {formatCurrency(pvp)}
              </span>
              <span className="text-[11px] font-medium text-zinc-400">
                PVP (IVA inc.)
              </span>
            </div>
          </div>

          {quantityInTicket > 0 && (
            <span className="rounded-lg border border-blue-800/60 bg-blue-950/50 px-2 py-1 text-xs font-bold text-blue-200 tabular-nums">
              {quantityInTicket} en ticket
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onAddProduct(product, false)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
              product.stock <= 0 && !product.isService
                ? 'border border-amber-800/60 bg-amber-950/50 text-amber-200 hover:bg-amber-900/50'
                : 'bg-blue-700 text-white shadow-sm hover:bg-blue-600'
            }`}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>
              {product.stock <= 0 && !product.isService
                ? 'Pedir y añadir'
                : 'Añadir al ticket'}
            </span>
          </button>

          {isTireProduct && (
            <button
              type="button"
              onClick={() => onAddProduct(product, true)}
              title="Añadir neumático + servicio de montaje, válvula y equilibrado"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 active:scale-[0.98]"
            >
              <Wrench className="h-3.5 w-3.5 text-zinc-300" />
              <span>+ Montaje</span>
            </button>
          )}
        </div>

        {product.upsell && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span className="truncate">Sugerencia cruzada disponible</span>
          </div>
        )}
      </div>
    </article>
  );
};
