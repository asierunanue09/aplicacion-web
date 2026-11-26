import React, { useMemo, useState } from 'react';
import {
  Search,
  Eye,
  ArrowRightCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { SaleRecord } from '../types/tpv';
import { formatCurrency, formatDateTimeEs } from '../utils/formatters';

interface SalesHistoryViewProps {
  records: SaleRecord[];
  onViewReceipt: (record: SaleRecord) => void;
  onLoadQuoteIntoTicket: (quote: SaleRecord) => void;
}

const PAYMENT_BADGE: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  records,
  onViewReceipt,
  onLoadQuoteIntoTicket,
}) => {
  const [filterKind, setFilterKind] = useState<'all' | 'venta' | 'presupuesto'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((rec) => {
      if (filterKind !== 'all' && rec.kind !== filterKind) return false;
      if (!q) return true;
      return (
        rec.documentNumber.toLowerCase().includes(q) ||
        rec.customer.name.toLowerCase().includes(q) ||
        rec.customer.plate.toLowerCase().includes(q) ||
        rec.customer.vehicleLabel.toLowerCase().includes(q)
      );
    });
  }, [records, filterKind, query]);

  const kpis = useMemo(() => {
    let salesRevenue = 0;
    let salesCount = 0;
    let quotesCount = 0;
    for (const r of records) {
      if (r.kind === 'venta') {
        salesRevenue += r.totals.totalPvp;
        salesCount += 1;
      } else {
        quotesCount += 1;
      }
    }
    return { salesRevenue, salesCount, quotesCount };
  }, [records]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Facturación Total (PVP)</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-white tabular-nums">
            {formatCurrency(kpis.salesRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Ventas Finalizadas</span>
            <Receipt className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white tabular-nums">
            {kpis.salesCount}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Presupuestos Guardados</span>
            <FileText className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white tabular-nums">
            {kpis.quotesCount}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'venta', label: 'Ventas' },
              { id: 'presupuesto', label: 'Presupuestos' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterKind(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterKind === tab.id
                  ? 'bg-blue-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nº documento, cliente o matrícula..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pr-3 pl-9 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-sm font-semibold text-zinc-300">No hay operaciones con estos filtros.</p>
          <p className="mt-1 text-xs text-zinc-500">
            Realiza un cobro o guarda un presupuesto desde el TPV para verlo aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente / Matrícula</th>
                <th className="px-4 py-3">Líneas</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3 text-right">Base Imp.</th>
                <th className="px-4 py-3 text-right">Total PVP</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((rec) => {
                const isSale = rec.kind === 'venta';
                return (
                  <tr key={rec.id} className="transition hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSale ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-zinc-400" />
                        )}
                        <span className="font-mono-tech font-bold text-zinc-100">
                          {rec.documentNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {formatDateTimeEs(rec.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-100">
                        {rec.customer.name || 'Cliente Mostrador'}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {rec.customer.plate ? (
                          <span className="font-mono-tech text-zinc-300">{rec.customer.plate}</span>
                        ) : (
                          'Sin matrícula'
                        )}
                        {rec.customer.vehicleLabel ? ` · ${rec.customer.vehicleLabel}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">
                      {rec.lines.reduce((s, l) => s + l.quantity, 0)} uds
                      {rec.laborLines.length > 0 ? ` + ${rec.laborLines.length} MO` : ''}
                    </td>
                    <td className="px-4 py-3">
                      {isSale && rec.paymentMethod ? (
                        <span className="rounded-full border border-emerald-800/60 bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                          {PAYMENT_BADGE[rec.paymentMethod]}
                        </span>
                      ) : rec.convertedToSaleId ? (
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
                          Convertido
                        </span>
                      ) : (
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                      {formatCurrency(rec.totals.taxableBase)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-extrabold text-zinc-100 tabular-nums">
                      {formatCurrency(rec.totals.totalPvp)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(rec)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </button>
                        {!isSale && !rec.convertedToSaleId && (
                          <button
                            type="button"
                            onClick={() => onLoadQuoteIntoTicket(rec)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-600"
                          >
                            <ArrowRightCircle className="h-3.5 w-3.5" />
                            <span>Cargar en TPV</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
