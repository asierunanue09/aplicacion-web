import initialProductsData from '../data/products.json';
import {
  ActiveTicketState,
  DocumentKind,
  ITpvRepository,
  Product,
  SaleRecord,
  StockMovement,
} from '../types/tpv';

const STORAGE_KEYS = {
  PRODUCTS: 'tallertpv_products_v1',
  ACTIVE_TICKET: 'tallertpv_active_ticket_v1',
  SALES_HISTORY: 'tallertpv_sales_history_v1',
  STOCK_MOVEMENTS: 'tallertpv_stock_movements_v1',
} as const;

export function createEmptyTicket(): ActiveTicketState {
  return {
    lines: [],
    laborLines: [],
    globalDiscountPercent: 0,
    customer: {
      name: '',
      plate: '',
      vehicleLabel: '',
      phoneOrTaxId: '',
      notes: '',
    },
  };
}

function cloneInitialProducts(): Product[] {
  return (initialProductsData as Product[]).map((p) => ({
    ...p,
    compatibleVehicleIds: [...p.compatibleVehicleIds],
    upsell: p.upsell ? { ...p.upsell } : undefined,
  }));
}

export function generateDocumentNumber(kind: DocumentKind, history: SaleRecord[]): string {
  const year = new Date().getFullYear();
  const prefix = kind === 'venta' ? `FAC-${year}-` : `PRE-${year}-`;
  const sameKindCount = history.filter((r) => r.kind === kind).length + 1;
  return `${prefix}${String(sameKindCount).padStart(4, '0')}`;
}

/**
 * Implementación localStorage del repositorio TPV.
 * Puede sustituirse por SupabaseRepository o FirebaseRepository manteniendo la firma async.
 */
class LocalStorageTpvRepository implements ITpvRepository {
  async getProducts(): Promise<Product[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!raw) {
        const seed = cloneInitialProducts();
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw) as Product[];
      const seedById = new Map(
        (initialProductsData as Product[]).map((item) => [item.id, item])
      );
      return parsed.map((item) => ({
        ...item,
        imageUrl: item.imageUrl ?? seedById.get(item.id)?.imageUrl,
      }));
    } catch {
      return cloneInitialProducts();
    }
  }

  async saveProducts(products: Product[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  async getActiveTicket(): Promise<ActiveTicketState> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TICKET);
      if (!raw) {
        return createEmptyTicket();
      }
      const parsed = JSON.parse(raw) as ActiveTicketState;
      return {
        ...createEmptyTicket(),
        ...parsed,
        customer: {
          ...createEmptyTicket().customer,
          ...(parsed.customer ?? {}),
        },
      };
    } catch {
      return createEmptyTicket();
    }
  }

  async saveActiveTicket(ticket: ActiveTicketState): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TICKET, JSON.stringify(ticket));
  }

  async getSalesHistory(): Promise<SaleRecord[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SALES_HISTORY);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as SaleRecord[];
    } catch {
      return [];
    }
  }

  async saveSaleRecord(record: SaleRecord): Promise<void> {
    const current = await this.getSalesHistory();
    const updated = [record, ...current];
    localStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify(updated));
  }

  async updateSaleRecord(record: SaleRecord): Promise<void> {
    const current = await this.getSalesHistory();
    const updated = current.map((item) => (item.id === record.id ? record : item));
    localStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify(updated));
  }

  async getStockMovements(): Promise<StockMovement[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as StockMovement[];
    } catch {
      return [];
    }
  }

  async saveStockMovements(movements: StockMovement[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
  }

  async resetDemoData(): Promise<{
    products: Product[];
    ticket: ActiveTicketState;
    history: SaleRecord[];
    movements: StockMovement[];
  }> {
    const products = cloneInitialProducts();
    const ticket = createEmptyTicket();
    const history: SaleRecord[] = [];
    const movements: StockMovement[] = [];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TICKET, JSON.stringify(ticket));
    localStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
    return { products, ticket, history, movements };
  }
}

export const tpvRepository: ITpvRepository = new LocalStorageTpvRepository();
