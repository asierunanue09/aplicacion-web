import {
  ActiveTicketState,
  CategoryId,
  Product,
  ProductCategory,
  StockStatus,
  TicketTotals,
} from '../types/tpv';

export const VAT_RATE = 0.21;

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  shortLabel: string;
  accentClass: string;
  badgeBgClass: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'all',
    label: 'Todas las Categorías',
    shortLabel: 'Todas',
    accentClass: 'text-zinc-300',
    badgeBgClass: 'bg-zinc-800/80 text-zinc-200 border-zinc-700',
  },
  {
    id: 'fluidos',
    label: 'Fluidos y Químicos',
    shortLabel: 'Fluidos',
    accentClass: 'text-slate-300',
    badgeBgClass: 'bg-slate-800/80 text-slate-200 border-slate-700',
  },
  {
    id: 'neumaticos',
    label: 'Neumáticos y Ruedas',
    shortLabel: 'Neumáticos',
    accentClass: 'text-stone-300',
    badgeBgClass: 'bg-stone-800/80 text-stone-200 border-stone-700',
  },
  {
    id: 'embragues',
    label: 'Embragues y Transmisión',
    shortLabel: 'Embragues',
    accentClass: 'text-zinc-300',
    badgeBgClass: 'bg-zinc-800/80 text-zinc-200 border-zinc-700',
  },
  {
    id: 'frenado',
    label: 'Frenado y Mantenimiento',
    shortLabel: 'Frenado / Mant.',
    accentClass: 'text-blue-300',
    badgeBgClass: 'bg-blue-950/60 text-blue-200 border-blue-800/60',
  },
];

export function getCategoryMeta(category: ProductCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcPvpWithVat(priceExclVat: number): number {
  return roundMoney(priceExclVat * (1 + VAT_RATE));
}

/**
 * Normaliza cadenas técnicas para búsqueda omnicanal tolerante a espacios,
 * guiones, barras y puntos (p.ej. "205/55 R16" <-> "20555r16", "03L 198 119 F" <-> "03l198119f").
 */
export function normalizeSearchToken(value: string): string {
  return value.toLowerCase().replace(/[\s\-/.]+/g, '');
}

export function getStockStatus(product: Product): {
  status: StockStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (product.isService) {
    return {
      status: 'en_stock',
      label: 'Servicio taller',
      badgeClass: 'bg-zinc-800 text-zinc-200 border-zinc-700',
      dotClass: 'bg-blue-400',
    };
  }
  if (product.stock <= 0) {
    return {
      status: 'bajo_pedido',
      label: 'Bajo pedido (24/48h)',
      badgeClass: 'bg-rose-950/50 text-rose-200 border-rose-800/50',
      dotClass: 'bg-rose-400',
    };
  }
  if (product.stock <= product.lowStockThreshold) {
    return {
      status: 'pocas_unidades',
      label: `Pocas unidades (${product.stock})`,
      badgeClass: 'bg-amber-950/50 text-amber-200 border-amber-800/50',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    status: 'en_stock',
    label: `En stock (${product.stock})`,
    badgeClass: 'bg-emerald-950/50 text-emerald-200 border-emerald-800/50',
    dotClass: 'bg-emerald-400',
  };
}

export function calculateTicketTotals(ticket: ActiveTicketState): TicketTotals {
  let partsGrossExclVat = 0;
  let laborGrossExclVat = 0;
  let lineDiscountsExclVat = 0;
  let totalItemsCount = 0;

  for (const line of ticket.lines) {
    const lineGross = roundMoney(line.unitPriceExclVat * line.quantity);
    const clampedPct = Math.min(100, Math.max(0, line.discountPercent));
    const lineDiscount = roundMoney(lineGross * (clampedPct / 100));
    partsGrossExclVat = roundMoney(partsGrossExclVat + lineGross);
    lineDiscountsExclVat = roundMoney(lineDiscountsExclVat + lineDiscount);
    totalItemsCount += line.quantity;
  }

  for (const labor of ticket.laborLines) {
    const laborGross = roundMoney(labor.hours * labor.hourlyRateExclVat);
    const clampedPct = Math.min(100, Math.max(0, labor.discountPercent));
    const laborDiscount = roundMoney(laborGross * (clampedPct / 100));
    laborGrossExclVat = roundMoney(laborGrossExclVat + laborGross);
    lineDiscountsExclVat = roundMoney(lineDiscountsExclVat + laborDiscount);
  }

  const netAfterLineDiscounts = roundMoney(
    partsGrossExclVat + laborGrossExclVat - lineDiscountsExclVat
  );
  const globalPct = Math.min(100, Math.max(0, ticket.globalDiscountPercent));
  const globalDiscountExclVat = roundMoney(netAfterLineDiscounts * (globalPct / 100));
  const totalDiscountsExclVat = roundMoney(lineDiscountsExclVat + globalDiscountExclVat);
  const taxableBase = roundMoney(Math.max(0, netAfterLineDiscounts - globalDiscountExclVat));
  const vatAmount = roundMoney(taxableBase * VAT_RATE);
  const totalPvp = roundMoney(taxableBase + vatAmount);

  return {
    partsGrossExclVat,
    laborGrossExclVat,
    lineDiscountsExclVat,
    globalDiscountExclVat,
    totalDiscountsExclVat,
    taxableBase,
    vatAmount,
    totalPvp,
    totalItemsCount,
  };
}

export function formatDateTimeEs(isoDate: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDate));
}
