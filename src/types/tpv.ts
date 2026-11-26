export type CategoryId =
  | 'all'
  | 'fluidos'
  | 'neumaticos'
  | 'embragues'
  | 'frenado';

export type ProductCategory = Exclude<CategoryId, 'all'>;

export type StockStatus = 'en_stock' | 'pocas_unidades' | 'bajo_pedido';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export type DocumentKind = 'venta' | 'presupuesto';

export interface VehicleSpec {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  tireSize: string;
}

export interface VehicleFilterState {
  brand: string;
  model: string;
  year: string;
  engine: string;
}

export interface UpsellSuggestion {
  targetProductId: string;
  quantity: number;
  message: string;
}

export interface Product {
  id: string;
  name: string;
  shortDesc: string;
  category: ProductCategory;
  brand: string;
  oemRef: string;
  aftermarketRef: string;
  tireSize?: string;
  imageUrl?: string;
  priceExclVat: number;
  stock: number;
  lowStockThreshold: number;
  compatibleVehicleIds: string[];
  universal?: boolean;
  isService?: boolean;
  upsell?: UpsellSuggestion;
}

export interface TicketLine {
  lineId: string;
  productId: string;
  name: string;
  brand: string;
  oemRef: string;
  aftermarketRef: string;
  category: ProductCategory;
  unitPriceExclVat: number;
  quantity: number;
  discountPercent: number;
  isService?: boolean;
}

export interface LaborLine {
  lineId: string;
  description: string;
  hours: number;
  hourlyRateExclVat: number;
  discountPercent: number;
}

export interface CustomerData {
  name: string;
  plate: string;
  vehicleLabel: string;
  phoneOrTaxId: string;
  notes: string;
}

export interface ActiveTicketState {
  lines: TicketLine[];
  laborLines: LaborLine[];
  globalDiscountPercent: number;
  customer: CustomerData;
  sourceQuoteId?: string;
}

export interface TicketTotals {
  partsGrossExclVat: number;
  laborGrossExclVat: number;
  lineDiscountsExclVat: number;
  globalDiscountExclVat: number;
  totalDiscountsExclVat: number;
  taxableBase: number;
  vatAmount: number;
  totalPvp: number;
  totalItemsCount: number;
}

export interface CardTerminalAuth {
  brand: string;
  last4: string;
  authCode: string;
  terminalId: string;
  entryMode: 'Contactless NFC' | 'Chip EMV';
}

export interface SaleRecord {
  id: string;
  documentNumber: string;
  kind: DocumentKind;
  createdAt: string;
  paymentMethod?: PaymentMethod;
  amountTendered?: number;
  changeDue?: number;
  cardAuth?: CardTerminalAuth;
  customer: CustomerData;
  lines: TicketLine[];
  laborLines: LaborLine[];
  globalDiscountPercent: number;
  totals: TicketTotals;
  convertedToSaleId?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'salida' | 'ajuste';
  qty: number;
  stockBefore: number;
  stockAfter: number;
  note: string;
  createdAt: string;
}

/**
 * Interfaz de repositorio desacoplada para facilitar migración futura
 * desde localStorage hacia Supabase / Firebase / API REST.
 */
export interface ITpvRepository {
  getProducts(): Promise<Product[]>;
  saveProducts(products: Product[]): Promise<void>;
  getActiveTicket(): Promise<ActiveTicketState>;
  saveActiveTicket(ticket: ActiveTicketState): Promise<void>;
  getSalesHistory(): Promise<SaleRecord[]>;
  saveSaleRecord(record: SaleRecord): Promise<void>;
  updateSaleRecord(record: SaleRecord): Promise<void>;
  getStockMovements(): Promise<StockMovement[]>;
  saveStockMovements(movements: StockMovement[]): Promise<void>;
  resetDemoData(): Promise<{
    products: Product[];
    ticket: ActiveTicketState;
    history: SaleRecord[];
    movements: StockMovement[];
  }>;
}
