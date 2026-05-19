import type {
  AuditLog,
  Booking,
  Customer,
  InventoryItem,
  MenuItem,
  Order,
  OtaSettlement,
  Expense,
  BankDeposit,
  Staff,
  SalaryRecord,
  LeasePayment,
  Payment,
  ResortSettings,
  Room,
  ServiceCharge,
  StockMovement,
} from './types';

export const DEFAULT_SETTINGS: ResortSettings = {
  resortName: 'Resort Management',
  address: '',
  gstin: '',
  phone: '',
  email: '',
  defaultCreditLimit: 3000,
  defaultCleaningFee: 250,
  sgstRate: 9,
  cgstRate: 9,
  lateCheckoutFee: 500,
  checkoutTime: '11:00',
  standardRate: 2000,
  deluxeRate: 3500,
  suiteRate: 6000,
  executiveRate: 8000,
  aggregators: [
    { name: 'MakeMyTrip', commissionPercent: 15 },
    { name: 'Agoda', commissionPercent: 12 },
    { name: 'Booking.com', commissionPercent: 18 }
  ],
  userCredentials: [
    { username: 'admin', passwordHash: '24075304a3f2d26f02279170e3ed33405c102a969bc0032b49c0d38c644f51bc', role: 'owner' },
    { username: 'reception', passwordHash: 'c830e0a5c4df7ee0dfb8b3d68102377c8e9cf6a17b2b73b5efc1c5cb5a796bfa', role: 'reception' },
    { username: 'restaurant', passwordHash: '3cd5f8d55fa4f7b60517865c71b56fb33767cb40d576a9a08eb19d4536750011', role: 'restaurant' }
  ],
};

const ROOM_CONFIGS: { floor: number; category: string; count: number; maxOcc: number }[] = [
  { floor: 1, category: 'Standard', count: 10, maxOcc: 2 },
  { floor: 2, category: 'Deluxe', count: 8, maxOcc: 3 },
  { floor: 3, category: 'Suite', count: 4, maxOcc: 4 },
  { floor: 4, category: 'Executive', count: 2, maxOcc: 4 },
];

export function buildRooms(): Room[] {
  const rooms: Room[] = [];

  for (const cfg of ROOM_CONFIGS) {
    for (let i = 1; i <= cfg.count; i++) {
      const num = `${cfg.floor}${i.toString().padStart(2, '0')}`;
      rooms.push({
        id: `R-${num}`,
        number: num,
        category: cfg.category,
        status: 'green',
        guest: null,
        guestMobile: null,
        bookingId: null,
        bill: 0,
        floor: cfg.floor,
        maxOccupancy: cfg.maxOcc,
        cleaningsToday: 0,
      });
    }
  }

  return rooms;
}

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_MENU: MenuItem[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_SERVICE_CHARGES: ServiceCharge[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_OTA_SETTLEMENTS: OtaSettlement[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_BANK_DEPOSITS: BankDeposit[] = [];
export const INITIAL_STAFF: Staff[] = [];
export const INITIAL_SALARY_RECORDS: SalaryRecord[] = [];
export const INITIAL_LEASE_PAYMENTS: LeasePayment[] = [];
