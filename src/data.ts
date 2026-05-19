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
    { username: 'admin', passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', role: 'owner' },
    { username: 'reception', passwordHash: '066a4a70376da00eb9e50a8e30725427faf9b9573d0c6430d28316497c889213', role: 'reception' },
    { username: 'restaurant', passwordHash: 'ee275d64dafcd283c25b00a66fb771834a2c2bfb1a7b472b67cf59fd6936254f', role: 'restaurant' }
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
