import React, { useState } from 'react';
import { Printer, X, CheckCircle2, FileText, Receipt } from 'lucide-react';
import { SaleRecord } from '../types/tpv';
import {
  formatCurrency,
  formatDateTimeEs,
  roundMoney,
} from '../utils/formatters';

interface ReceiptModalProps {
  record: SaleRecord | null;
  onClose: () => void;
}

const PAYMENT_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta / Datáfono',
  transferencia: 'Transferencia Bancaria',
};

function TicketBarcode({ code }: { code: string }) {
  const bars = code.split('').map((ch, idx) => {
    const val = ch.charCodeAt(0);
    const width = (val % 3) + 1;
    const x = idx * 8;
    return <rect key={idx} x={x} y={0} width={width * 2} height={36} fill="#0f172a" />;
  });
  return (
    <svg
      viewBox={`0 0 ${Math.max(120, code.length * 8)} 36`}
      className="mx-auto h-9 w-48"
      aria-label={`Código de barras ${code}`}
    >
      {bars}
    </svg>
  );
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  record,
  onClose,
}) => {
  const [formatView, setFormatView] = useState<'ticket' | 'document'>('ticket');

  if (!record) return null;

  const isSale = record.kind === 'venta';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Modal toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            {isSale ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <FileText className="h-5 w-5 text-blue-400" />
            )}
            <span className="text-sm font-bold text-white">
              {isSale ? 'Ticket de Venta' : 'Presupuesto'}{' '}
              <span className="font-mono-tech text-blue-400">
                {record.documentNumber}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFormatView('ticket')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition ${
                  formatView === 'ticket'
                    ? 'bg-blue-700 text-white'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Ticket 80mm</span>
              </button>
              <button
                type="button"
                onClick={() => setFormatView('document')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition ${
                  formatView === 'document'
                    ? 'bg-blue-700 text-white'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Formato A4</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-5">
          {formatView === 'ticket' ? (
            /* VISTA TICKET TÉRMICO 80MM */
            <div
              id="printable-receipt"
              className="font-mono-tech mx-auto w-full max-w-[360px] rounded-xl border border-slate-300 bg-white px-5 py-6 text-[11px] leading-relaxed text-slate-900 shadow-2xl"
            >
              <div className="text-center">
                <img
                  src="/logo-tallertpv.svg"
                  alt="Logo TallerTPV"
                  className="mx-auto mb-2 h-11 w-11 rounded-lg"
                />
                <div className="text-sm font-black tracking-tight text-slate-950">
                  TALLERTPV MECÁNICA S.L.
                </div>
                <div className="text-[10px] text-slate-600">
                  Pol. Ind. Automoción, Nave 14
                </div>
                <div className="text-[10px] text-slate-600">
                  CIF: B-98765432 · Tel: 943 000 112
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-slate-400" />

              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold">
                    {isSale ? 'TICKET SIMPLIFICADO:' : 'PRESUPUESTO:'}
                  </span>
                  <span className="font-bold">{record.documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA / HORA:</span>
                  <span>{formatDateTimeEs(record.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="truncate pl-2 font-semibold">
                    {record.customer.name || 'MOSTRADOR'}
                  </span>
                </div>
                {record.customer.plate && (
                  <div className="flex justify-between">
                    <span>MATRÍCULA:</span>
                    <span className="font-bold">{record.customer.plate}</span>
                  </div>
                )}
                {record.customer.vehicleLabel && (
                  <div className="truncate text-[10px] text-slate-600">
                    VEH: {record.customer.vehicleLabel}
                  </div>
                )}
              </div>

              <div className="my-3 border-t border-dashed border-slate-400" />

              {/* Conceptos */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>CANT · CONCEPTO</span>
                  <span>IMP. s/IVA</span>
                </div>

                {record.lines.map((line) => {
                  const net = roundMoney(
                    line.unitPriceExclVat *
                      line.quantity *
                      (1 - line.discountPercent / 100)
                  );
                  return (
                    <div key={line.lineId} className="space-y-0.5">
                      <div className="flex justify-between gap-2 font-semibold">
                        <span className="flex-1">
                          {line.quantity}x {line.name}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatCurrency(net)}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {line.brand} · {line.aftermarketRef}
                        {line.discountPercent > 0
                          ? ` · Dto ${line.discountPercent}%`
                          : ''}
                      </div>
                    </div>
                  );
                })}

                {record.laborLines.map((labor) => {
                  const net = roundMoney(
                    labor.hours *
                      labor.hourlyRateExclVat *
                      (1 - labor.discountPercent / 100)
                  );
                  return (
                    <div key={labor.lineId} className="space-y-0.5">
                      <div className="flex justify-between gap-2 font-semibold">
                        <span className="flex-1">
                          {labor.hours}h [MO] {labor.description}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="my-3 border-t border-dashed border-slate-400" />

              {/* Totales */}
              <div className="space-y-1 text-[11px]">
                {record.totals.totalDiscountsExclVat > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>DESCUENTOS:</span>
                    <span className="tabular-nums">
                      -{formatCurrency(record.totals.totalDiscountsExclVat)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>BASE IMPONIBLE:</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(record.totals.taxableBase)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (21%):</span>
                  <span className="tabular-nums">
                    {formatCurrency(record.totals.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-1.5 text-sm font-black">
                  <span>TOTAL PVP:</span>
                  <span className="tabular-nums">
                    {formatCurrency(record.totals.totalPvp)}
                  </span>
                </div>
              </div>

              {/* Bloque Datáfono / Pago */}
              <div className="my-3 border-t border-dashed border-slate-400" />

              {isSale && record.paymentMethod ? (
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold">
                    <span>FORMA PAGO:</span>
                    <span>{PAYMENT_LABEL[record.paymentMethod]}</span>
                  </div>

                  {record.paymentMethod === 'efectivo' &&
                    record.amountTendered !== undefined && (
                      <>
                        <div className="flex justify-between">
                          <span>ENTREGADO:</span>
                          <span>{formatCurrency(record.amountTendered)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>CAMBIO:</span>
                          <span>{formatCurrency(record.changeDue ?? 0)}</span>
                        </div>
                      </>
                    )}

                  {record.cardAuth && (
                    <div className="mt-2 rounded border border-slate-300 bg-slate-50 p-2 text-center text-[9px]">
                      <div className="font-bold uppercase">
                        COMPROBANTE DATÁFONO · COPIA CLIENTE
                      </div>
                      <div>TERMINAL: {record.cardAuth.terminalId}</div>
                      <div>
                        {record.cardAuth.brand} **** {record.cardAuth.last4} ·{' '}
                        {record.cardAuth.entryMode}
                      </div>
                      <div className="font-bold">
                        AUT: {record.cardAuth.authCode} · APROBADA
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-[9px] text-slate-600">
                  PRESUPUESTO VÁLIDO 15 DÍAS · SIN VALIDEZ FISCAL
                </div>
              )}

              <div className="my-3 border-t border-dashed border-slate-400" />

              <TicketBarcode code={record.documentNumber} />
              <p className="mt-2 text-center text-[10px] font-bold text-slate-700">
                ¡GRACIAS POR SU CONFIANZA!
              </p>
            </div>
          ) : (
            /* VISTA DOCUMENTO A4 / PRESUPUESTO */
            <div
              id="printable-receipt"
              className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-inner"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo-tallertpv.svg"
                    alt="Logo TallerTPV"
                    className="h-12 w-12 shrink-0 rounded-xl"
                  />
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">
                      TallerTPV Recambios & Mecánica S.L.
                    </h2>
                    <p className="text-xs text-slate-600">
                      Pol. Ind. Automoción, Nave 14 · CIF: B-98765432 · Tel: 943 000 112
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-md px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider ${
                      isSale
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isSale ? 'TICKET DE VENTA' : 'PRESUPUESTO (VALIDEZ 15 DÍAS)'}
                  </span>
                  <p className="font-mono-tech mt-1 text-sm font-bold text-slate-900">
                    {record.documentNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTimeEs(record.createdAt)}
                  </p>
                </div>
              </div>

              {/* Customer / Vehicle */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Cliente:</span>{' '}
                  <strong className="text-slate-900">
                    {record.customer.name || 'Cliente Mostrador'}
                  </strong>
                  {record.customer.phoneOrTaxId && (
                    <p className="text-slate-600">
                      Tel/NIF: {record.customer.phoneOrTaxId}
                    </p>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Matrícula:</span>{' '}
                  <strong className="font-mono-tech text-slate-900">
                    {record.customer.plate || '—'}
                  </strong>
                  {record.customer.vehicleLabel && (
                    <p className="text-slate-600">
                      Vehículo: {record.customer.vehicleLabel}
                    </p>
                  )}
                </div>
              </div>

              {/* Table */}
              <table className="mt-4 w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-left text-[11px] uppercase text-slate-500">
                    <th className="py-2 pr-2">Concepto / Referencia</th>
                    <th className="px-2 py-2 text-center">Uds/H</th>
                    <th className="px-2 py-2 text-right">Precio s/IVA</th>
                    <th className="px-2 py-2 text-right">Dto</th>
                    <th className="py-2 pl-2 text-right">Importe s/IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {record.lines.map((line) => {
                    const net = roundMoney(
                      line.unitPriceExclVat *
                        line.quantity *
                        (1 - line.discountPercent / 100)
                    );
                    return (
                      <tr key={line.lineId}>
                        <td className="py-2 pr-2">
                          <div className="font-semibold text-slate-900">
                            {line.name}
                          </div>
                          <div className="font-mono-tech text-[10px] text-slate-500">
                            {line.brand} · OEM: {line.oemRef} · Ref: {line.aftermarketRef}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center font-semibold tabular-nums">
                          {line.quantity}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {formatCurrency(line.unitPriceExclVat)}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {line.discountPercent > 0 ? `${line.discountPercent}%` : '—'}
                        </td>
                        <td className="py-2 pl-2 text-right font-bold tabular-nums">
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })}

                  {record.laborLines.map((labor) => {
                    const net = roundMoney(
                      labor.hours *
                        labor.hourlyRateExclVat *
                        (1 - labor.discountPercent / 100)
                    );
                    return (
                      <tr key={labor.lineId} className="bg-zinc-100/40">
                        <td className="py-2 pr-2">
                          <div className="font-semibold text-slate-900">
                            [MO] {labor.description}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Mano de obra de taller
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center font-semibold tabular-nums">
                          {labor.hours}h
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {formatCurrency(labor.hourlyRateExclVat)}/h
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {labor.discountPercent > 0
                            ? `${labor.discountPercent}%`
                            : '—'}
                        </td>
                        <td className="py-2 pl-2 text-right font-bold tabular-nums">
                          {formatCurrency(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 flex flex-col items-end border-t-2 border-slate-300 pt-3">
                <div className="w-full max-w-xs space-y-1 text-xs">
                  {record.totals.totalDiscountsExclVat > 0 && (
                    <div className="flex justify-between text-orange-700">
                      <span>Descuentos aplicados:</span>
                      <span className="font-semibold tabular-nums">
                        -{formatCurrency(record.totals.totalDiscountsExclVat)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>Base Imponible:</span>
                    <span className="font-bold tabular-nums">
                      {formatCurrency(record.totals.taxableBase)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>IVA (21%):</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(record.totals.vatAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 text-base font-black text-slate-900">
                    <span>TOTAL PVP:</span>
                    <span className="tabular-nums">
                      {formatCurrency(record.totals.totalPvp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Footer */}
              <div className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-slate-600">
                {isSale && record.paymentMethod ? (
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>
                      Forma de pago:{' '}
                      <strong>{PAYMENT_LABEL[record.paymentMethod]}</strong>
                      {record.cardAuth && (
                        <>
                          {' '}
                          ({record.cardAuth.brand} **** {record.cardAuth.last4} · AUT{' '}
                          {record.cardAuth.authCode})
                        </>
                      )}
                    </span>
                    {record.paymentMethod === 'efectivo' &&
                      record.amountTendered !== undefined && (
                        <span>
                          Entregado: {formatCurrency(record.amountTendered)} ·
                          Cambio: {formatCurrency(record.changeDue ?? 0)}
                        </span>
                      )}
                  </div>
                ) : (
                  <p>
                    Documento informativo sin validez fiscal. Los precios pueden
                    variar pasados 15 días. Stock sujeto a disponibilidad en el
                    momento de aceptación.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
