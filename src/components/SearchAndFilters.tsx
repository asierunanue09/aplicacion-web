import React, { useMemo } from 'react';
import {
  Search,
  X,
  Car,
  FilterX,
  Droplets,
  CircleDot,
  Cog,
  Disc,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import {
  CategoryId,
  Product,
  VehicleFilterState,
  VehicleSpec,
} from '../types/tpv';
import { CATEGORIES } from '../utils/formatters';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryId;
  onCategoryChange: (c: CategoryId) => void;
  vehicleFilter: VehicleFilterState;
  onVehicleFilterChange: (next: VehicleFilterState) => void;
  includeUniversalWithVehicle: boolean;
  onToggleUniversal: (val: boolean) => void;
  vehicles: VehicleSpec[];
  products: Product[];
  filteredCount: number;
  selectedVehicle: VehicleSpec | null;
  onAssignVehicleToTicket: (vehicle: VehicleSpec) => void;
}

const QUICK_SEARCH_EXAMPLES = [
  '03L198119F',
  'Luk 624',
  '205/55 R16',
  'Brembo',
  '5W30',
  'Varta',
];

function getCategoryIcon(id: CategoryId) {
  switch (id) {
    case 'fluidos':
      return <Droplets className="h-4 w-4" />;
    case 'neumaticos':
      return <CircleDot className="h-4 w-4" />;
    case 'embragues':
      return <Cog className="h-4 w-4" />;
    case 'frenado':
      return <Disc className="h-4 w-4" />;
    default:
      return <LayoutGrid className="h-4 w-4" />;
  }
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  vehicleFilter,
  onVehicleFilterChange,
  includeUniversalWithVehicle,
  onToggleUniversal,
  vehicles,
  products,
  filteredCount,
  selectedVehicle,
  onAssignVehicleToTicket,
}) => {
  const brands = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand))).sort(),
    [vehicles]
  );

  const models = useMemo(() => {
    if (!vehicleFilter.brand) return [];
    return Array.from(
      new Set(
        vehicles
          .filter((v) => v.brand === vehicleFilter.brand)
          .map((v) => v.model)
      )
    ).sort();
  }, [vehicles, vehicleFilter.brand]);

  const years = useMemo(() => {
    if (!vehicleFilter.brand || !vehicleFilter.model) return [];
    return Array.from(
      new Set(
        vehicles
          .filter(
            (v) =>
              v.brand === vehicleFilter.brand && v.model === vehicleFilter.model
          )
          .map((v) => String(v.year))
      )
    ).sort((a, b) => Number(b) - Number(a));
  }, [vehicles, vehicleFilter.brand, vehicleFilter.model]);

  const engines = useMemo(() => {
    if (!vehicleFilter.brand || !vehicleFilter.model || !vehicleFilter.year)
      return [];
    return vehicles
      .filter(
        (v) =>
          v.brand === vehicleFilter.brand &&
          v.model === vehicleFilter.model &&
          String(v.year) === vehicleFilter.year
      )
      .map((v) => v.engine);
  }, [vehicles, vehicleFilter.brand, vehicleFilter.model, vehicleFilter.year]);

  const hasVehicleFilter = Boolean(
    vehicleFilter.brand ||
      vehicleFilter.model ||
      vehicleFilter.year ||
      vehicleFilter.engine
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      all: products.length,
      fluidos: 0,
      neumaticos: 0,
      embragues: 0,
      frenado: 0,
    };
    for (const p of products) {
      counts[p.category] += 1;
    }
    return counts;
  }, [products]);

  const handleBrandChange = (brand: string) => {
    onVehicleFilterChange({ brand, model: '', year: '', engine: '' });
  };

  const handleModelChange = (model: string) => {
    const matchingYears = Array.from(
      new Set(
        vehicles
          .filter((v) => v.brand === vehicleFilter.brand && v.model === model)
          .map((v) => String(v.year))
      )
    );
    const autoYear = matchingYears.length === 1 ? matchingYears[0] : '';
    const matchingEngines = autoYear
      ? vehicles
          .filter(
            (v) =>
              v.brand === vehicleFilter.brand &&
              v.model === model &&
              String(v.year) === autoYear
          )
          .map((v) => v.engine)
      : [];
    const autoEngine = matchingEngines.length === 1 ? matchingEngines[0] : '';
    onVehicleFilterChange({
      brand: vehicleFilter.brand,
      model,
      year: autoYear,
      engine: autoEngine,
    });
  };

  const handleYearChange = (year: string) => {
    const matchingEngines = vehicles
      .filter(
        (v) =>
          v.brand === vehicleFilter.brand &&
          v.model === vehicleFilter.model &&
          String(v.year) === year
      )
      .map((v) => v.engine);
    const autoEngine = matchingEngines.length === 1 ? matchingEngines[0] : '';
    onVehicleFilterChange({
      ...vehicleFilter,
      year,
      engine: autoEngine,
    });
  };

  const handleEngineChange = (engine: string) => {
    onVehicleFilterChange({
      ...vehicleFilter,
      engine,
    });
  };

  const clearVehicleFilter = () => {
    onVehicleFilterChange({ brand: '', model: '', year: '', engine: '' });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3.5 shadow-xl sm:p-4">
      {/* Buscador Omnicanal */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-blue-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por Ref. OEM (03L198119F), Aftermarket (Luk 624 3518 00), Medida (205/55 R16), Marca o Pieza..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pr-11 pl-11 text-sm text-zinc-100 placeholder-zinc-500 shadow-inner transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none sm:text-base"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              title="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Búsquedas rápidas de ejemplo */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 font-medium text-zinc-400">
            Búsquedas rápidas:
          </span>
          {QUICK_SEARCH_EXAMPLES.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => onSearchChange(token)}
              className="font-mono-tech rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300 transition hover:border-blue-600/60 hover:text-blue-300"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Vehículo en Cascada */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <Car className="h-4 w-4 text-blue-400" />
            <span>Compatibilidad por Vehículo (Marca › Modelo › Año › Motor)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasVehicleFilter && (
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeUniversalWithVehicle}
                  onChange={(e) => onToggleUniversal(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-600"
                />
                <span>Incluir fluidos/universales</span>
              </label>
            )}

            {selectedVehicle && (
              <button
                type="button"
                onClick={() => onAssignVehicleToTicket(selectedVehicle)}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-900/50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Vincular al ticket ({selectedVehicle.tireSize})</span>
              </button>
            )}

            {hasVehicleFilter && (
              <button
                type="button"
                onClick={clearVehicleFilter}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
              >
                <FilterX className="h-3.5 w-3.5" />
                <span>Limpiar filtro</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={vehicleFilter.brand}
            onChange={(e) => handleBrandChange(e.target.value)}
            aria-label="Marca del vehículo"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none"
          >
            <option value="">1. Marca (Todas)</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={vehicleFilter.model}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={!vehicleFilter.brand}
            aria-label="Modelo del vehículo"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
          >
            <option value="">2. Modelo</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={vehicleFilter.year}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={!vehicleFilter.model}
            aria-label="Año del vehículo"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
          >
            <option value="">3. Año</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={vehicleFilter.engine}
            onChange={(e) => handleEngineChange(e.target.value)}
            disabled={!vehicleFilter.year}
            aria-label="Motorización del vehículo"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
          >
            <option value="">4. Motorización</option>
            {engines.map((eng) => (
              <option key={eng} value={eng}>
                {eng}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Categorías + Contador de resultados */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  active
                    ? 'border-blue-600 bg-blue-950/60 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span className={active ? 'text-blue-400' : cat.accentClass}>
                  {getCategoryIcon(cat.id)}
                </span>
                <span>{cat.shortLabel}</span>
                <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 text-[11px] tabular-nums text-zinc-400">
                  {categoryCounts[cat.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs font-medium text-zinc-400">
          Mostrando{' '}
          <span className="font-bold text-zinc-100 tabular-nums">
            {filteredCount}
          </span>{' '}
          {filteredCount === 1 ? 'artículo' : 'artículos'}
        </div>
      </div>
    </section>
  );
};
