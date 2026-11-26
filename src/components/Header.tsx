import React from 'react';
import {
  LayoutGrid,
  History,
  RotateCcw,
  AlertTriangle,
  Database,
  Warehouse,
} from 'lucide-react';

interface HeaderProps {
  activeView: 'tpv' | 'history' | 'warehouse';
  onChangeView: (view: 'tpv' | 'history' | 'warehouse') => void;
  historyCount: number;
  lowStockCount: number;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onChangeView,
  historyCount,
  lowStockCount,
  onResetDemo,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/logo-tallertpv.svg"
            alt="Logo TallerTPV Mecánica"
            className="h-11 w-11 shrink-0 rounded-xl shadow-md shadow-black/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-zinc-100">
                Taller<span className="text-blue-400">TPV</span>
              </h1>
              <span className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                PRO B2B/B2C
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Mostrador de Recambios · Neumáticos · Taller Mecánico
            </p>
          </div>
        </div>

        {/* Navigation + Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {lowStockCount > 0 && (
            <button
              type="button"
              onClick={() => onChangeView('warehouse')}
              className="hidden items-center gap-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 px-2.5 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-900/50 md:flex"
              title="Ver alertas de stock en Almacén"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>{lowStockCount} alertas de stock</span>
            </button>
          )}

          <nav className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => onChangeView('tpv')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                activeView === 'tpv'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>TPV / Catálogo</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeView('warehouse')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                activeView === 'warehouse'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Warehouse className="h-4 w-4" />
              <span>Almacén</span>
              {lowStockCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-xs font-bold tabular-nums ${
                    activeView === 'warehouse'
                      ? 'bg-blue-950/60 text-blue-100'
                      : 'bg-amber-950/70 text-amber-300'
                  }`}
                >
                  {lowStockCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onChangeView('history')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                activeView === 'history'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Historial</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-xs font-bold tabular-nums ${
                  activeView === 'history'
                    ? 'bg-blue-950/60 text-blue-100'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {historyCount}
              </span>
            </button>
          </nav>

          <div className="hidden items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-[11px] text-zinc-400 xl:flex">
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            <span>Persistencia local</span>
          </div>

          <button
            type="button"
            onClick={onResetDemo}
            title="Restaurar inventario e historial demo"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reiniciar Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
