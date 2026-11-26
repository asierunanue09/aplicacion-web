import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit3,
  Filter,
  Layers,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { Product, ProductCategory, StockMovement } from '../types/tpv';
import {
  CATEGORIES,
  formatCurrency,
  getCategoryMeta,
  getStockStatus,
  calcPvpWithVat,
} from '../utils/formatters';

// ─── Tipos internos ──────────────────────────────────────────────────────────

type StockFilter = 'all' | 'ok' | 'low' | 'out';
type SortField = 'name' | 'stock' | 'category' | 'value';
type SortDir = 'asc' | 'desc';

interface AdjustModalState {
  product: Product;
  mode: 'add' | 'subtract' | 'set';
}

interface WarehouseViewProps {
  products: Product[];
  movements: StockMovement[];
  onUpdateStock: (
    productId: string,
    newStock: number,
    movement: Omit<StockMovement, 'id' | 'createdAt'>
  ) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function movementIcon(type: StockMovement['type']) {
  if (type === 'entrada') return <ArrowUpCircle className="h-4 w-4 text-emerald-400" />;
  if (type === 'salida') return <ArrowDownCircle className="h-4 w-4 text-rose-400" />;
  return <RefreshCw className="h-4 w-4 text-blue-400" />;
}

// ─── Modal de ajuste de stock ─────────────────────────────────────────────────

const AdjustModal: React.FC<{
  state: AdjustModalState;
  onClose: () => void;
  onConfirm: (product: Product, qty: number, mode: AdjustModalState['mode'], note: string) => void;
}> = ({ state, onClose, onConfirm }) => {
  const { product, mode } = state;
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const stockInfo = getStockStatus(product);

  const previewStock = (() => {
    if (mode === 'add') return product.stock + qty;
    if (mode === 'subtract') return Math.max(0, product.stock - qty);
    return qty;
  })();

  const modeLabel = mode === 'add' ? 'Entrada de stock' : mode === 'subtract' ? 'Salida / Merma' : 'Ajuste de inventario';
  const modeColor = mode === 'add' ? 'text-emerald-400' : mode === 'subtract' ? 'text-rose-400' : 'text-blue-400';
  const modeIcon = mode === 'add'
    ? <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
    : mode === 'subtract'
    ? <ArrowDownCircle className="h-5 w-5 text-rose-400" />
    : <RefreshCw className="h-5 w-5 text-blue-400" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            {modeIcon}
            <span className={`text-sm font-extrabold ${modeColor}`}>{modeLabel}</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Producto */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-zinc-400">Producto</p>
            <p className="mt-0.5 text-sm font-bold text-zinc-100">{product.name}</p>
            <p className="text-xs text-zinc-500">{product.brand} · {product.aftermarketRef}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-zinc-400">Stock actual:</span>
              <span className={`text-sm font-extrabold tabular-nums ${stockInfo.dotClass.replace('bg-', 'text-')}`}>
                {product.isService ? '∞' : product.stock} ud.
              </span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              {mode === 'set' ? 'Nuevo stock total (ud.)' : 'Cantidad a ' + (mode === 'add' ? 'añadir' : 'restar')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(0, q - 1))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={0}
                step={1}
                value={qty}
                onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2 text-center text-xl font-extrabold text-white tabular-nums focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQty(q => q + 1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Preview */}
          {!product.isService && (
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <span className="text-xs text-zinc-400">Stock resultante:</span>
              <span className={`text-lg font-black tabular-nums ${
                previewStock <= 0 ? 'text-rose-400' : previewStock <= product.lowStockThreshold ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {previewStock} ud.
              </span>
            </div>
          )}

          {/* Nota */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Nota / Motivo <span className="font-normal text-zinc-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Recepción albarán 2024-11, devolución cliente..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(product, qty, mode, note)}
              disabled={qty <= 0 && mode !== 'set'}
              className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-500' :
                mode === 'subtract' ? 'bg-rose-700 hover:bg-rose-600' :
                'bg-blue-700 hover:bg-blue-600'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  products,
  movements,
  onUpdateStock,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [adjustModal, setAdjustModal] = useState<AdjustModalState | null>(null);
  const [showMovements, setShowMovements] = useState(false);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const physicals = products.filter((p) => !p.isService);
    const totalSku = physicals.length;
    const inStock = physicals.filter((p) => p.stock > p.lowStockThreshold).length;
    const lowStock = physicals.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const outOfStock = physicals.filter((p) => p.stock <= 0).length;
    const totalUnits = physicals.reduce((s, p) => s + p.stock, 0);
    const totalValue = physicals.reduce((s, p) => s + p.stock * p.priceExclVat, 0);
    return { totalSku, inStock, lowStock, outOfStock, totalUnits, totalValue };
  }, [products]);

  // ── Filtrado + ordenación ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().replace(/[\s\-/.]+/g, '');
    return products
      .filter((p) => !p.isService)
      .filter((p) => {
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
        if (stockFilter === 'ok') return p.stock > p.lowStockThreshold;
        if (stockFilter === 'low') return p.stock > 0 && p.stock <= p.lowStockThreshold;
        if (stockFilter === 'out') return p.stock <= 0;
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        const hay = [p.name, p.brand, p.oemRef, p.aftermarketRef, p.shortDesc]
          .join(' ')
          .toLowerCase()
          .replace(/[\s\-/.]+/g, '');
        return hay.includes(q);
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'es');
        else if (sortField === 'stock') cmp = a.stock - b.stock;
        else if (sortField === 'category') cmp = a.category.localeCompare(b.category, 'es');
        else if (sortField === 'value') cmp = a.stock * a.priceExclVat - b.stock * b.priceExclVat;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [products, search, categoryFilter, stockFilter, sortField, sortDir]);

  // ── Handlers ──────────────────────────────────────────────────────────
  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 text-zinc-600" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />;
  }

  function handleConfirmAdjust(
    product: Product,
    qty: number,
    mode: AdjustModalState['mode'],
    note: string
  ) {
    const stockBefore = product.stock;
    const stockAfter = mode === 'add' ? stockBefore + qty : mode === 'subtract' ? Math.max(0, stockBefore - qty) : qty;
    const movType: StockMovement['type'] = mode === 'add' ? 'entrada' : mode === 'subtract' ? 'salida' : 'ajuste';

    const movement: Omit<StockMovement, 'id' | 'createdAt'> = {
      productId: product.id,
      productName: product.name,
      type: movType,
      qty,
      stockBefore,
      stockAfter,
      note: note.trim() || (mode === 'add' ? 'Entrada manual' : mode === 'subtract' ? 'Salida / ajuste' : 'Ajuste de inventario'),
    };

    onUpdateStock(product.id, stockAfter, movement);
    setAdjustModal(null);
  }

  const STOCK_FILTERS: { id: StockFilter; label: string; count: number; color: string }[] = [
    { id: 'all', label: 'Todos', count: products.filter(p => !p.isService).length, color: 'text-zinc-300' },
    { id: 'ok', label: 'En stock', count: kpis.inStock, color: 'text-emerald-400' },
    { id: 'low', label: 'Stock bajo', count: kpis.lowStock, color: 'text-amber-400' },
    { id: 'out', label: 'Sin stock', count: kpis.outOfStock, color: 'text-rose-400' },
  ];

  return (
    <main className="mx-auto max-w-[1920px] space-y-5 p-3 sm:p-4 lg:p-6">

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Referencias', value: kpis.totalSku, icon: <Layers className="h-5 w-5" />, color: 'text-zinc-200', border: 'border-zinc-800', bg: 'bg-zinc-900' },
          { label: 'En stock', value: kpis.inStock, icon: <PackageCheck className="h-5 w-5" />, color: 'text-emerald-300', border: 'border-emerald-900/60', bg: 'bg-emerald-950/40' },
          { label: 'Stock bajo', value: kpis.lowStock, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-amber-300', border: 'border-amber-900/60', bg: 'bg-amber-950/40' },
          { label: 'Sin stock', value: kpis.outOfStock, icon: <PackageX className="h-5 w-5" />, color: 'text-rose-300', border: 'border-rose-900/60', bg: 'bg-rose-950/40' },
          { label: 'Unidades tot.', value: kpis.totalUnits.toLocaleString('es-ES'), icon: <Box className="h-5 w-5" />, color: 'text-blue-300', border: 'border-blue-900/60', bg: 'bg-blue-950/40' },
          { label: 'Valor almacén', value: formatCurrency(kpis.totalValue), icon: <ClipboardList className="h-5 w-5" />, color: 'text-zinc-200', border: 'border-zinc-700', bg: 'bg-zinc-900', wide: true },
        ].map((kpi) => (
          <div key={kpi.label} className={`flex items-center gap-3 rounded-xl border ${kpi.border} ${kpi.bg} px-4 py-3`}>
            <span className={kpi.color}>{kpi.icon}</span>
            <div>
              <p className="text-[11px] text-zinc-500">{kpi.label}</p>
              <p className={`text-lg font-extrabold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de herramientas ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ref OEM, marca..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Filtro categoría */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="appearance-none rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-8 pr-6 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Filtros de stock */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStockFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                stockFilter === f.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={f.color}>{f.label}</span>
              <span className={`tabular-nums text-[10px] ${f.color}`}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Botón movimientos */}
        <button
          type="button"
          onClick={() => setShowMovements((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
            showMovements
              ? 'border-blue-700 bg-blue-950/60 text-blue-200'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Movimientos</span>
          {movements.length > 0 && (
            <span className="rounded-full bg-blue-800 px-1.5 text-[10px] font-bold text-blue-100">
              {movements.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Layout: Tabla + (opcional) Panel movimientos ──────────────── */}
      <div className={`flex gap-5 ${showMovements ? 'flex-col xl:flex-row xl:items-start' : ''}`}>

        {/* ── Tabla de productos ──────────────────────────────────────── */}
        <div className={`min-w-0 ${showMovements ? 'flex-1' : 'w-full'}`}>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            {/* Cabecera tabla */}
            <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
              <p className="text-xs text-zinc-400">
                Mostrando <strong className="text-zinc-200">{filtered.length}</strong> de{' '}
                <strong className="text-zinc-200">{products.filter(p => !p.isService).length}</strong> referencias físicas
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    {/* Producto */}
                    <th className="py-3 pl-4 pr-2 text-left">
                      <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
                        Referencia / Producto <SortIcon field="name" />
                      </button>
                    </th>
                    {/* Categoría */}
                    <th className="hidden px-2 py-3 text-left sm:table-cell">
                      <button type="button" onClick={() => toggleSort('category')} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
                        Categoría <SortIcon field="category" />
                      </button>
                    </th>
                    {/* PVP */}
                    <th className="hidden px-2 py-3 text-right md:table-cell">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">PVP c/IVA</span>
                    </th>
                    {/* Stock */}
                    <th className="px-2 py-3 text-right">
                      <button type="button" onClick={() => toggleSort('stock')} className="ml-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
                        Stock <SortIcon field="stock" />
                      </button>
                    </th>
                    {/* Umbral */}
                    <th className="hidden px-2 py-3 text-right lg:table-cell">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Umbral</span>
                    </th>
                    {/* Valor */}
                    <th className="hidden px-2 py-3 text-right xl:table-cell">
                      <button type="button" onClick={() => toggleSort('value')} className="ml-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
                        Valor s/IVA <SortIcon field="value" />
                      </button>
                    </th>
                    {/* Estado */}
                    <th className="px-2 py-3 text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Estado</span>
                    </th>
                    {/* Acciones */}
                    <th className="py-3 pl-2 pr-4 text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Ajuste</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-zinc-500">
                        <PackageX className="mx-auto mb-2 h-9 w-9 text-zinc-700" />
                        <p className="text-sm">No hay referencias que coincidan con los filtros</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product) => {
                      const stockInfo = getStockStatus(product);
                      const pvp = calcPvpWithVat(product.priceExclVat);
                      const catMeta = getCategoryMeta(product.category);
                      const lineValue = product.stock * product.priceExclVat;

                      return (
                        <tr key={product.id} className="bg-zinc-950 transition hover:bg-zinc-900/60">
                          {/* Referencia */}
                          <td className="py-3 pl-4 pr-2">
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              )}
                              <div>
                                <p className="font-semibold text-zinc-100 leading-tight">{product.name}</p>
                                <p className="text-[11px] text-zinc-500">{product.brand}</p>
                                <p className="font-mono text-[10px] text-zinc-600">{product.oemRef} · {product.aftermarketRef}</p>
                              </div>
                            </div>
                          </td>

                          {/* Categoría */}
                          <td className="hidden px-2 py-3 sm:table-cell">
                            <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold ${catMeta.badgeBgClass}`}>
                              {catMeta.shortLabel}
                            </span>
                          </td>

                          {/* PVP */}
                          <td className="hidden px-2 py-3 text-right tabular-nums text-zinc-200 md:table-cell">
                            {pvp.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </td>

                          {/* Stock */}
                          <td className="px-2 py-3 text-right">
                            <span className={`text-lg font-extrabold tabular-nums ${
                              product.stock <= 0 ? 'text-rose-400' :
                              product.stock <= product.lowStockThreshold ? 'text-amber-400' :
                              'text-emerald-400'
                            }`}>
                              {product.stock}
                            </span>
                            <span className="ml-1 text-xs text-zinc-600">ud</span>
                          </td>

                          {/* Umbral */}
                          <td className="hidden px-2 py-3 text-right tabular-nums text-zinc-500 lg:table-cell">
                            {product.lowStockThreshold} ud
                          </td>

                          {/* Valor */}
                          <td className="hidden px-2 py-3 text-right tabular-nums xl:table-cell">
                            <span className={lineValue > 0 ? 'text-zinc-200' : 'text-zinc-600'}>
                              {formatCurrency(lineValue)}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="px-2 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stockInfo.badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${stockInfo.dotClass}`} />
                              {stockInfo.label}
                            </span>
                          </td>

                          {/* Acciones de ajuste */}
                          <td className="py-3 pl-2 pr-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="Entrada de stock"
                                onClick={() => setAdjustModal({ product, mode: 'add' })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-emerald-400 transition hover:bg-emerald-900/60"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Salida / merma"
                                onClick={() => setAdjustModal({ product, mode: 'subtract' })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-400 transition hover:bg-rose-900/60"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Ajuste directo de inventario"
                                onClick={() => setAdjustModal({ product, mode: 'set' })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-900/60 bg-blue-950/40 text-blue-400 transition hover:bg-blue-900/60"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Panel de movimientos ────────────────────────────────────── */}
        {showMovements && (
          <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 xl:w-80 xl:shrink-0">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-bold text-zinc-200">Movimientos de Stock</span>
              </div>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                {movements.length} mov.
              </span>
            </div>

            {movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-zinc-600">
                <Truck className="mb-2 h-8 w-8 text-zinc-700" />
                <p className="text-sm">Sin movimientos registrados</p>
                <p className="mt-1 text-xs">Usa los botones + − ✎ o realiza ventas en el TPV para registrar movimientos</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60 overflow-y-auto max-h-[600px]">
                {movements.map((mov) => (
                  <div key={mov.id} className="bg-zinc-950 px-4 py-3 hover:bg-zinc-900/60 transition">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">{movementIcon(mov.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-zinc-200">{mov.productName}</p>
                        <p className="text-[11px] text-zinc-500">{mov.note}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-600">
                          <span>
                            {mov.type === 'entrada' ? '+' : mov.type === 'salida' ? '-' : '='}{mov.qty} ud
                          </span>
                          <span>·</span>
                          <span>{mov.stockBefore} → <strong className={`${
                            mov.stockAfter <= 0 ? 'text-rose-400' : mov.stockAfter > 2 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>{mov.stockAfter}</strong></span>
                          <span>·</span>
                          <span>{new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }).format(new Date(mov.createdAt))}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
                        mov.type === 'entrada' ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300' :
                        mov.type === 'salida' ? 'border-rose-800/60 bg-rose-950/40 text-rose-300' :
                        'border-blue-800/60 bg-blue-950/40 text-blue-300'
                      }`}>
                        {mov.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {movements.length > 0 && (
              <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 py-2.5">
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Entradas: <strong className="text-emerald-400">{movements.filter(m => m.type === 'entrada').length}</strong></span>
                  <span>Salidas: <strong className="text-rose-400">{movements.filter(m => m.type === 'salida').length}</strong></span>
                  <span>Ajustes: <strong className="text-blue-400">{movements.filter(m => m.type === 'ajuste').length}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal de ajuste ──────────────────────────────────────────── */}
      {adjustModal && (
        <AdjustModal
          state={adjustModal}
          onClose={() => setAdjustModal(null)}
          onConfirm={handleConfirmAdjust}
        />
      )}

      {/* ── Leyenda rápida ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
          <span>Solo se muestran referencias físicas (servicios de taller excluidos)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>En stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Stock ≤ umbral de alerta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span>Sin stock / bajo pedido</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-bold text-zinc-300">Valor almacén:</span>
          <span className="font-bold text-zinc-200">Valorado s/IVA (precio catálogo s/IVA × stock)</span>
        </div>
      </div>
    </main>
  );
};
