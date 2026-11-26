import { useEffect, useMemo, useState } from 'react';
import vehiclesData from './data/vehicles.json';
import {
  ActiveTicketState,
  CardTerminalAuth,
  CategoryId,
  CustomerData,
  LaborLine,
  PaymentMethod,
  Product,
  SaleRecord,
  StockMovement,
  VehicleFilterState,
  VehicleSpec,
} from './types/tpv';
import {
  createEmptyTicket,
  generateDocumentNumber,
  tpvRepository,
} from './services/tpvRepository';
import {
  calculateTicketTotals,
  normalizeSearchToken,
} from './utils/formatters';
import { Header } from './components/Header';
import { SearchAndFilters } from './components/SearchAndFilters';
import { ProductCard } from './components/ProductCard';
import { ActiveUpsellPrompt, UpsellBanner } from './components/UpsellBanner';
import { TicketPanel } from './components/TicketPanel';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SalesHistoryView } from './components/SalesHistoryView';
import { WarehouseView } from './components/WarehouseView';
import { PackageSearch } from 'lucide-react';

const VEHICLES = vehiclesData as VehicleSpec[];

function makeLineId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ticket, setTicket] = useState<ActiveTicketState>(createEmptyTicket);
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeView, setActiveView] = useState<'tpv' | 'warehouse' | 'history'>('tpv');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilterState>({
    brand: '',
    model: '',
    year: '',
    engine: '',
  });
  const [includeUniversalWithVehicle, setIncludeUniversalWithVehicle] =
    useState(true);

  const [upsellPrompt, setUpsellPrompt] = useState<ActiveUpsellPrompt | null>(
    null
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<SaleRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const [loadedProducts, loadedTicket, loadedHistory, loadedMovements] =
        await Promise.all([
          tpvRepository.getProducts(),
          tpvRepository.getActiveTicket(),
          tpvRepository.getSalesHistory(),
          tpvRepository.getStockMovements(),
        ]);
      if (!active) return;
      setProducts(loadedProducts);
      setTicket(loadedTicket);
      setHistory(loadedHistory);
      setMovements(loadedMovements);
      setIsLoaded(true);
    }
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    tpvRepository.saveActiveTicket(ticket);
  }, [ticket, isLoaded]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const productsById = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const p of products) {
      map[p.id] = p;
    }
    return map;
  }, [products]);

  const matchingVehicleIds = useMemo(() => {
    const hasFilter = Boolean(
      vehicleFilter.brand ||
        vehicleFilter.model ||
        vehicleFilter.year ||
        vehicleFilter.engine
    );
    if (!hasFilter) return null;

    return new Set(
      VEHICLES.filter((v) => {
        if (vehicleFilter.brand && v.brand !== vehicleFilter.brand)
          return false;
        if (vehicleFilter.model && v.model !== vehicleFilter.model)
          return false;
        if (vehicleFilter.year && String(v.year) !== vehicleFilter.year)
          return false;
        if (vehicleFilter.engine && v.engine !== vehicleFilter.engine)
          return false;
        return true;
      }).map((v) => v.id)
    );
  }, [vehicleFilter]);

  const selectedExactVehicle = useMemo(() => {
    if (!matchingVehicleIds || matchingVehicleIds.size !== 1) return null;
    const [onlyId] = Array.from(matchingVehicleIds);
    return VEHICLES.find((v) => v.id === onlyId) ?? null;
  }, [matchingVehicleIds]);

  const filteredProducts = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    const normQ = normalizeSearchToken(searchQuery);

    return products.filter((product) => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      if (matchingVehicleIds) {
        const directMatch = product.compatibleVehicleIds.some((vid) =>
          matchingVehicleIds.has(vid)
        );
        const universalMatch =
          includeUniversalWithVehicle && Boolean(product.universal);
        if (!directMatch && !universalMatch) {
          return false;
        }
      }

      if (!rawQ) return true;

      const fields = [
        product.name,
        product.shortDesc,
        product.brand,
        product.oemRef,
        product.aftermarketRef,
        product.tireSize ?? '',
      ];

      return fields.some((field) => {
        const lower = field.toLowerCase();
        if (lower.includes(rawQ)) return true;
        if (normQ.length >= 2) {
          return normalizeSearchToken(field).includes(normQ);
        }
        return false;
      });
    });
  }, [
    products,
    selectedCategory,
    matchingVehicleIds,
    includeUniversalWithVehicle,
    searchQuery,
  ]);

  const ticketQuantityByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of ticket.lines) {
      map[line.productId] = (map[line.productId] ?? 0) + line.quantity;
    }
    return map;
  }, [ticket.lines]);

  const lowStockCount = useMemo(
    () =>
      products.filter((p) => !p.isService && p.stock <= p.lowStockThreshold)
        .length,
    [products]
  );

  const totals = useMemo(() => calculateTicketTotals(ticket), [ticket]);

  const addProductQuantityToTicket = (product: Product, qtyToAdd: number) => {
    setTicket((prev) => {
      const existing = prev.lines.find((l) => l.productId === product.id);
      if (existing) {
        return {
          ...prev,
          lines: prev.lines.map((l) =>
            l.productId === product.id
              ? { ...l, quantity: l.quantity + qtyToAdd }
              : l
          ),
        };
      }
      return {
        ...prev,
        lines: [
          ...prev.lines,
          {
            lineId: makeLineId(),
            productId: product.id,
            name: product.name,
            brand: product.brand,
            oemRef: product.oemRef,
            aftermarketRef: product.aftermarketRef,
            category: product.category,
            unitPriceExclVat: product.priceExclVat,
            quantity: qtyToAdd,
            discountPercent: 0,
            isService: product.isService,
          },
        ],
      };
    });
  };

  const handleAddProduct = (product: Product, withTireService = false) => {
    addProductQuantityToTicket(product, 1);

    if (withTireService) {
      const mountService = productsById['neu-servicio-montaje'];
      if (mountService) {
        addProductQuantityToTicket(mountService, 1);
      }
      setUpsellPrompt(null);
      setToastMessage(`Añadido ${product.brand} + Montaje, válvula y equilibrado`);
      return;
    }

    if (product.upsell) {
      const target = productsById[product.upsell.targetProductId];
      if (target) {
        setUpsellPrompt({
          sourceProductName: product.brand,
          targetProduct: target,
          quantity: product.upsell.quantity,
          message: product.upsell.message,
        });
      }
    }
  };

  const handleAcceptUpsell = (prompt: ActiveUpsellPrompt) => {
    addProductQuantityToTicket(prompt.targetProduct, prompt.quantity);
    setToastMessage(
      `Complemento añadido: ${prompt.quantity}× ${prompt.targetProduct.name}`
    );
    setUpsellPrompt(null);
  };

  const handleUpdateLineQuantity = (lineId: string, nextQty: number) => {
    if (nextQty <= 0) {
      handleRemoveLine(lineId);
      return;
    }
    setTicket((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.lineId === lineId ? { ...l, quantity: nextQty } : l
      ),
    }));
  };

  const handleUpdateLineDiscount = (
    lineId: string,
    discountPercent: number
  ) => {
    setTicket((prev) => ({
      ...prev,
      lines: prev.lines.map((l) =>
        l.lineId === lineId ? { ...l, discountPercent } : l
      ),
    }));
  };

  const handleRemoveLine = (lineId: string) => {
    setTicket((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.lineId !== lineId),
    }));
  };

  const handleAddLabor = (labor: Omit<LaborLine, 'lineId'>) => {
    setTicket((prev) => ({
      ...prev,
      laborLines: [
        ...prev.laborLines,
        {
          ...labor,
          lineId: makeLineId(),
        },
      ],
    }));
  };

  const handleRemoveLabor = (lineId: string) => {
    setTicket((prev) => ({
      ...prev,
      laborLines: prev.laborLines.filter((l) => l.lineId !== lineId),
    }));
  };

  const handleUpdateLaborDiscount = (
    lineId: string,
    discountPercent: number
  ) => {
    setTicket((prev) => ({
      ...prev,
      laborLines: prev.laborLines.map((l) =>
        l.lineId === lineId ? { ...l, discountPercent } : l
      ),
    }));
  };

  const handleUpdateGlobalDiscount = (globalDiscountPercent: number) => {
    setTicket((prev) => ({
      ...prev,
      globalDiscountPercent,
    }));
  };

  const handleUpdateCustomer = (patch: Partial<CustomerData>) => {
    setTicket((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        ...patch,
      },
    }));
  };

  const handleAssignVehicleToTicket = (vehicle: VehicleSpec) => {
    handleUpdateCustomer({
      vehicleLabel: `${vehicle.brand} ${vehicle.model} (${vehicle.year}) ${vehicle.engine}`,
    });
    setToastMessage(
      `Vehículo vinculado al ticket: ${vehicle.brand} ${vehicle.model}`
    );
  };

  const handleClearTicket = () => {
    setTicket(createEmptyTicket());
    setUpsellPrompt(null);
  };

  const handleConfirmSale = async (
    method: PaymentMethod,
    amountTendered?: number,
    changeDue?: number,
    cardAuth?: CardTerminalAuth
  ) => {
    const qtyDeducted: Record<string, number> = {};
    for (const line of ticket.lines) {
      if (!line.isService) {
        qtyDeducted[line.productId] =
          (qtyDeducted[line.productId] ?? 0) + line.quantity;
      }
    }

    const saleDocNumber = generateDocumentNumber('venta', history);
    const nowIso = new Date().toISOString();
    const saleMovements: StockMovement[] = [];

    const updatedProducts = products.map((p) => {
      const deducted = qtyDeducted[p.id];
      if (!deducted) return p;
      const nextStock = Math.max(0, p.stock - deducted);
      saleMovements.push({
        id: makeLineId(),
        productId: p.id,
        productName: p.name,
        type: 'salida',
        qty: deducted,
        stockBefore: p.stock,
        stockAfter: nextStock,
        note: `Venta TPV ${saleDocNumber}`,
        createdAt: nowIso,
      });
      return {
        ...p,
        stock: nextStock,
      };
    });

    const newSale: SaleRecord = {
      id: makeLineId(),
      documentNumber: saleDocNumber,
      kind: 'venta',
      createdAt: nowIso,
      paymentMethod: method,
      amountTendered,
      changeDue,
      cardAuth,
      customer: { ...ticket.customer },
      lines: ticket.lines.map((l) => ({ ...l })),
      laborLines: ticket.laborLines.map((l) => ({ ...l })),
      globalDiscountPercent: ticket.globalDiscountPercent,
      totals,
    };

    const nextMovements = [...saleMovements, ...movements];

    await tpvRepository.saveProducts(updatedProducts);
    await tpvRepository.saveSaleRecord(newSale);
    await tpvRepository.saveStockMovements(nextMovements);

    let nextHistory = [newSale, ...history];
    if (ticket.sourceQuoteId) {
      const sourceQuote = history.find((r) => r.id === ticket.sourceQuoteId);
      if (sourceQuote) {
        const updatedQuote: SaleRecord = {
          ...sourceQuote,
          convertedToSaleId: newSale.id,
        };
        await tpvRepository.updateSaleRecord(updatedQuote);
        nextHistory = nextHistory.map((r) =>
          r.id === updatedQuote.id ? updatedQuote : r
        );
      }
    }

    setProducts(updatedProducts);
    setHistory(nextHistory);
    setMovements(nextMovements);
    setIsCheckoutOpen(false);
    setTicket(createEmptyTicket());
    setUpsellPrompt(null);
    setActiveReceipt(newSale);
    setToastMessage(
      `Venta ${newSale.documentNumber} cobrada y stock actualizado`
    );
  };

  const handleUpdateStock = async (
    productId: string,
    newStock: number,
    movement: Omit<StockMovement, 'id' | 'createdAt'>
  ) => {
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    );
    const newMov: StockMovement = {
      ...movement,
      id: makeLineId(),
      createdAt: new Date().toISOString(),
    };
    const nextMovements = [newMov, ...movements];

    setProducts(updatedProducts);
    setMovements(nextMovements);
    await Promise.all([
      tpvRepository.saveProducts(updatedProducts),
      tpvRepository.saveStockMovements(nextMovements),
    ]);
    setToastMessage(`Stock actualizado: ${movement.productName} (${newStock} ud.)`);
  };

  const handleCreateQuote = async () => {
    const newQuote: SaleRecord = {
      id: makeLineId(),
      documentNumber: generateDocumentNumber('presupuesto', history),
      kind: 'presupuesto',
      createdAt: new Date().toISOString(),
      customer: { ...ticket.customer },
      lines: ticket.lines.map((l) => ({ ...l })),
      laborLines: ticket.laborLines.map((l) => ({ ...l })),
      globalDiscountPercent: ticket.globalDiscountPercent,
      totals,
    };

    await tpvRepository.saveSaleRecord(newQuote);
    setHistory((prev) => [newQuote, ...prev]);
    setActiveReceipt(newQuote);
    setToastMessage(`Presupuesto ${newQuote.documentNumber} guardado`);
  };

  const handleLoadQuoteIntoTicket = (quote: SaleRecord) => {
    setTicket({
      lines: quote.lines.map((l) => ({ ...l })),
      laborLines: quote.laborLines.map((l) => ({ ...l })),
      globalDiscountPercent: quote.globalDiscountPercent,
      customer: { ...quote.customer },
      sourceQuoteId: quote.id,
    });
    setActiveView('tpv');
    setToastMessage(
      `Presupuesto ${quote.documentNumber} cargado en el ticket activo`
    );
  };

  const handleResetDemo = async () => {
    const fresh = await tpvRepository.resetDemoData();
    setProducts(fresh.products);
    setTicket(fresh.ticket);
    setHistory(fresh.history);
    setMovements(fresh.movements);
    setUpsellPrompt(null);
    setSearchQuery('');
    setSelectedCategory('all');
    setVehicleFilter({ brand: '', model: '', year: '', engine: '' });
    setToastMessage('Datos de demostración e inventario restaurados');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        historyCount={history.length}
        lowStockCount={lowStockCount}
        onResetDemo={handleResetDemo}
      />

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2.5 text-xs font-bold text-zinc-100 shadow-2xl backdrop-blur">
          {toastMessage}
        </div>
      )}

      {activeView === 'tpv' ? (
        <main className="mx-auto max-w-[1920px] p-3 sm:p-4 lg:p-6">
          {/* Split-Screen 70% Izquierda / 30% Derecha */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            {/* Panel Izquierdo (70%) */}
            <div className="w-full space-y-4 lg:w-[70%]">
              <SearchAndFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                vehicleFilter={vehicleFilter}
                onVehicleFilterChange={setVehicleFilter}
                includeUniversalWithVehicle={includeUniversalWithVehicle}
                onToggleUniversal={setIncludeUniversalWithVehicle}
                vehicles={VEHICLES}
                products={products}
                filteredCount={filteredProducts.length}
                selectedVehicle={selectedExactVehicle}
                onAssignVehicleToTicket={handleAssignVehicleToTicket}
              />

              <UpsellBanner
                prompt={upsellPrompt}
                onAccept={handleAcceptUpsell}
                onDismiss={() => setUpsellPrompt(null)}
              />

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/60 px-6 py-16 text-center">
                  <PackageSearch className="mb-3 h-10 w-10 text-zinc-600" />
                  <h3 className="text-base font-bold text-zinc-200">
                    No se encontraron repuestos compatibles
                  </h3>
                  <p className="mt-1 max-w-md text-xs text-zinc-400">
                    Prueba con otra referencia OEM / Aftermarket, limpia el filtro de vehículo o activa la casilla de fluidos y consumibles universales.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInTicket={
                        ticketQuantityByProduct[product.id] ?? 0
                      }
                      onAddProduct={handleAddProduct}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Panel Derecho (30%) */}
            <div className="w-full lg:w-[30%] lg:min-w-[340px]">
              <TicketPanel
                ticket={ticket}
                totals={totals}
                productsById={productsById}
                onUpdateLineQuantity={handleUpdateLineQuantity}
                onUpdateLineDiscount={handleUpdateLineDiscount}
                onRemoveLine={handleRemoveLine}
                onAddLabor={handleAddLabor}
                onRemoveLabor={handleRemoveLabor}
                onUpdateLaborDiscount={handleUpdateLaborDiscount}
                onUpdateGlobalDiscount={handleUpdateGlobalDiscount}
                onUpdateCustomer={handleUpdateCustomer}
                onClearTicket={handleClearTicket}
                onOpenCheckout={() => setIsCheckoutOpen(true)}
                onCreateQuote={handleCreateQuote}
              />
            </div>
          </div>
        </main>
      ) : activeView === 'warehouse' ? (
        <WarehouseView
          products={products}
          movements={movements}
          onUpdateStock={handleUpdateStock}
        />
      ) : (
        <SalesHistoryView
          records={history}
          onViewReceipt={setActiveReceipt}
          onLoadQuoteIntoTicket={handleLoadQuoteIntoTicket}
        />
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        totals={totals}
        customerLabel={ticket.customer.name}
        plateLabel={ticket.customer.plate}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmSale={handleConfirmSale}
      />

      <ReceiptModal
        record={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
}

export default App;
