import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Wrench,
  User,
  Percent,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ActiveTicketState,
  CustomerData,
  LaborLine,
  Product,
  TicketTotals,
} from '../types/tpv';
import { formatCurrency, roundMoney } from '../utils/formatters';

interface TicketPanelProps {
  ticket: ActiveTicketState;
  totals: TicketTotals;
  productsById: Record<string, Product>;
  onUpdateLineQuantity: (lineId: string, nextQty: number) => void;
  onUpdateLineDiscount: (lineId: string, discountPercent: number) => void;
  onRemoveLine: (lineId: string) => void;
  onAddLabor: (labor: Omit<LaborLine, 'lineId'>) => void;
  onRemoveLabor: (lineId: string) => void;
  onUpdateLaborDiscount: (lineId: string, discountPercent: number) => void;
  onUpdateGlobalDiscount: (discountPercent: number) => void;
  onUpdateCustomer: (patch: Partial<CustomerData>) => void;
  onClearTicket: () => void;
  onOpenCheckout: () => void;
  onCreateQuote: () => void;
}

export const TicketPanel: React.FC<TicketPanelProps> = ({
  ticket,
  totals,
  productsById,
  onUpdateLineQuantity,
  onUpdateLineDiscount,
  onRemoveLine,
  onAddLabor,
  onRemoveLabor,
  onUpdateLaborDiscount,
  onUpdateGlobalDiscount,
  onUpdateCustomer,
  onClearTicket,
  onOpenCheckout,
  onCreateQuote,
}) => {
  const [showLaborForm, setShowLaborForm] = useState(false);
  const [laborDesc, setLaborDesc] = useState('Mano de obra mecánica');
  const [laborHours, setLaborHours] = useState('1.5');
  const [laborRate, setLaborRate] = useState('52');
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);

  const hasItems = ticket.lines.length > 0 || ticket.laborLines.length > 0;

  const handleLaborSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Number(laborHours.replace(',', '.'));
    const rate = Number(laborRate.replace(',', '.'));
    if (!laborDesc.trim() || !Number.isFinite(hours) || hours <= 0 || !Number.isFinite(rate) || rate < 0) return;
    onAddLabor({
      description: laborDesc.trim(),
      hours: roundMoney(hours),
      hourlyRateExclVat: roundMoney(rate),
      discountPercent: 0,
    });
    setLaborDesc('Mano de obra mecánica');
    setLaborHours('1.0');
    setShowLaborForm(false);
  };

  return (
    <aside className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-92px)]">
      {/* Cabecera Ticket */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-100">
                Ticket Activo
              </h2>
              {ticket.sourceQuoteId && (
                <span className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                  DESDE PRESUPUESTO
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              {totals.totalItemsCount} repuestos · {ticket.laborLines.length} mano de obra
            </p>
          </div>
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={onClearTicket}
            title="Vaciar ticket actual"
            className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 transition hover:border-rose-800/60 hover:bg-rose-950/40 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Vaciar</span>
          </button>
        )}
      </div>

      {/* Datos Cliente y Matrícula */}
      <div className="border-b border-zinc-800 bg-zinc-950/40 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setShowCustomerDetails((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-300"
        >
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-blue-400" />
            Cliente y Matrícula
            {ticket.customer.plate && (
              <span className="font-mono-tech ml-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[11px] font-bold text-zinc-200">
                {ticket.customer.plate.toUpperCase()}
              </span>
            )}
          </span>
          {showCustomerDetails ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>
        {showCustomerDetails && (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={ticket.customer.name}
              onChange={(e) => onUpdateCustomer({ name: e.target.value })}
              placeholder="Cliente / Empresa"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
            />
            <input
              type="text"
              value={ticket.customer.plate}
              onChange={(e) => onUpdateCustomer({ plate: e.target.value.toUpperCase() })}
              placeholder="Matrícula (4582 KLM)"
              className="font-mono-tech rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs uppercase text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
            />
            <input
              type="text"
              value={ticket.customer.vehicleLabel}
              onChange={(e) => onUpdateCustomer({ vehicleLabel: e.target.value })}
              placeholder="Vehículo (Golf VII 2.0 TDI)"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
            />
            <input
              type="text"
              value={ticket.customer.phoneOrTaxId}
              onChange={(e) => onUpdateCustomer({ phoneOrTaxId: e.target.value })}
              placeholder="Teléfono o NIF/CIF"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Lista de líneas del Ticket */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3 lg:min-h-[200px]">
        {!hasItems && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-10 text-center">
            <ShoppingCart className="mb-2 h-8 w-8 text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-300">Ticket vacío</p>
            <p className="mt-1 text-xs text-zinc-500">
              Añade repuestos, neumáticos o mano de obra desde el catálogo.
            </p>
          </div>
        )}

        {ticket.lines.map((line) => {
          const catalogProduct = productsById[line.productId];
          const maxStock = catalogProduct?.stock ?? 999;
          const isBackorderWarning = !line.isService && catalogProduct && line.quantity > maxStock;
          const lineNetExclVat = roundMoney(
            line.unitPriceExclVat * line.quantity * (1 - Math.min(100, Math.max(0, line.discountPercent)) / 100)
          );
          return (
            <div key={line.lineId} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-100" title={line.name}>{line.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                    <span className="font-semibold text-zinc-400">{line.brand}</span>
                    <span>·</span>
                    <span className="font-mono-tech text-blue-300">{line.aftermarketRef}</span>
                    <span>·</span>
                    <span className="tabular-nums">{formatCurrency(line.unitPriceExclVat)}/ud</span>
                  </div>
                  {isBackorderWarning && (
                    <p className="mt-1 text-[10px] font-semibold text-amber-300">
                      Stock disp.: {maxStock} ud (resto bajo pedido)
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLine(line.lineId)}
                  aria-label="Eliminar línea"
                  className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateLineQuantity(line.lineId, line.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!Number.isNaN(val) && val >= 1) onUpdateLineQuantity(line.lineId, val);
                    }}
                    className="h-7 w-11 rounded-lg border border-zinc-700 bg-zinc-900 text-center text-xs font-bold text-zinc-100 tabular-nums focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateLineQuantity(line.lineId, line.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-500">Dto.</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={line.discountPercent}
                    onChange={(e) => onUpdateLineDiscount(line.lineId, Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="h-7 w-12 rounded-lg border border-zinc-700 bg-zinc-900 px-1.5 text-right text-xs font-semibold text-zinc-200 tabular-nums focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-500">%</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-zinc-100 tabular-nums">{formatCurrency(lineNetExclVat)}</span>
                  <span className="block text-[10px] text-zinc-600">sin IVA</span>
                </div>
              </div>
            </div>
          );
        })}

        {ticket.laborLines.map((labor) => {
          const laborNetExclVat = roundMoney(
            labor.hours * labor.hourlyRateExclVat * (1 - Math.min(100, Math.max(0, labor.discountPercent)) / 100)
          );
          return (
            <div key={labor.lineId} className="rounded-xl border border-zinc-700/60 bg-zinc-950/60 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <p className="truncate text-xs font-bold text-zinc-200">{labor.description}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-400 tabular-nums">
                    {labor.hours} h × {formatCurrency(labor.hourlyRateExclVat)}/h
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLabor(labor.lineId)}
                  aria-label="Eliminar mano de obra"
                  className="rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-zinc-700/40 pt-2">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-500">Dto.</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={labor.discountPercent}
                    onChange={(e) => onUpdateLaborDiscount(labor.lineId, Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="h-7 w-12 rounded-lg border border-zinc-700 bg-zinc-900 px-1.5 text-right text-xs font-semibold text-zinc-200 tabular-nums focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-500">%</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-zinc-200 tabular-nums">{formatCurrency(laborNetExclVat)}</span>
                  <span className="block text-[10px] text-zinc-600">sin IVA</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Añadir Mano de Obra Personalizada */}
      <div className="border-t border-zinc-800 px-3 py-2">
        {!showLaborForm ? (
          <button
            type="button"
            onClick={() => setShowLaborForm(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>+ Añadir Mano de Obra (horas × €/h)</span>
          </button>
        ) : (
          <form onSubmit={handleLaborSubmit} className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-950 p-2.5">
            <input
              type="text"
              value={laborDesc}
              onChange={(e) => setLaborDesc(e.target.value)}
              placeholder="Descripción (ej. Sustitución kit embrague)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-blue-600 focus:outline-none"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-zinc-500">Horas</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 tabular-nums focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-zinc-500">Tarifa €/hora (sin IVA)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={laborRate}
                  onChange={(e) => setLaborRate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 tabular-nums focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowLaborForm(false)} className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:text-white">
                Cancelar
              </button>
              <button type="submit" className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-bold text-white hover:bg-blue-600">
                Añadir
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Totales Fiscales */}
      <div className="border-t border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
            <Percent className="h-3.5 w-3.5 text-zinc-400" />
            Descuento Global Ticket
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={ticket.globalDiscountPercent}
              onChange={(e) => onUpdateGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="w-14 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-right text-xs font-bold text-zinc-100 tabular-nums focus:border-blue-600 focus:outline-none"
            />
            <span className="text-xs font-bold text-zinc-500">%</span>
          </div>
        </div>

        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-500">
            <dt>Subtotal bruto (sin IVA)</dt>
            <dd className="font-medium text-zinc-300 tabular-nums">
              {formatCurrency(totals.partsGrossExclVat + totals.laborGrossExclVat)}
            </dd>
          </div>
          {totals.totalDiscountsExclVat > 0 && (
            <div className="flex justify-between text-zinc-400">
              <dt>Descuentos aplicados</dt>
              <dd className="font-semibold tabular-nums">-{formatCurrency(totals.totalDiscountsExclVat)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-800 pt-1.5 text-zinc-300">
            <dt className="font-semibold">Base Imponible</dt>
            <dd className="font-bold text-zinc-100 tabular-nums">{formatCurrency(totals.taxableBase)}</dd>
          </div>
          <div className="flex justify-between text-zinc-400">
            <dt>IVA (21%)</dt>
            <dd className="font-semibold text-zinc-300 tabular-nums">{formatCurrency(totals.vatAmount)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-zinc-700 pt-2">
            <dt className="text-sm font-extrabold uppercase tracking-wider text-zinc-100">Total PVP</dt>
            <dd className="text-2xl font-black tracking-tight text-white tabular-nums">{formatCurrency(totals.totalPvp)}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <button
            type="button"
            disabled={!hasItems}
            onClick={onCreateQuote}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-3 text-xs font-bold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="h-4 w-4 text-zinc-400" />
            <span>Generar Presupuesto</span>
          </button>

          <button
            type="button"
            disabled={!hasItems}
            onClick={onOpenCheckout}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CreditCard className="h-4 w-4" />
            <span>Cobrar Venta</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
