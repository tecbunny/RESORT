// ── Room ────────────────────────────────────────────────────
export type RoomStatus = 'green' | 'blue' | 'red' | 'pink' | 'yellow' | 'grey';

export interface Room {
  id: string;
  number: string;
  category: string;
  status: RoomStatus;
  guest: string | null;
  guestMobile: string | null;
  bookingId: string | null;
  bill: number;
  floor: number;
  maxOccupancy: number;
  cleaningsToday: number;
}

// ── Customer ────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  mobile: string;
  idType: string;
  idNumber: string;
  idDocumentName?: string;
  address: string;
  lastVisit: string;
  status: 'Active' | 'In-House' | 'Inactive';
  stays: number;
}

// ── Booking ─────────────────────────────────────────────────
export type BookingStatus = 'reserved' | 'active' | 'settled' | 'cancelled' | 'no-show';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  roomId: string;
  roomNumber: string;
  category: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  guests: number;
  tariff: number;
  advance: number;
  totalBilled: number;
  totalPaid: number;
  creditLimit: number;
  source: 'Direct' | 'OTA';
  otaName?: string;
  otaReference?: string;
  otaCommission?: number;
  createdAt: string;
}

// ── Extra Services / Damage Charges ─────────────────────────
export interface ServiceCharge {
  id: string;
  bookingId: string;
  roomId: string;
  roomNumber: string;
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

// ── Restaurant / Bar Orders ────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  category: 'food' | 'beverage' | 'bar';
  price: number;
  tax: number; // percentage
  available: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  qty: number;
  rate: number;
  tax: number;
  total: number;
}

export type OrderStatus = 'active' | 'paid' | 'posted' | 'cancelled';

export interface Order {
  id: string;
  bookingId: string | null;
  roomNumber: string | null;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: OrderStatus;
  paymentMode: string | null;
  createdAt: string;
  type: 'restaurant' | 'bar';
}

// ── Payments ────────────────────────────────────────────────
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Owner Adjustment' | 'OTA Collect' | 'OTA Commission';

export interface Payment {
  id: string;
  bookingId: string | null;
  orderId: string | null;
  amount: number;
  mode: PaymentMode;
  transactionRef: string;
  collectedBy: string;
  createdAt: string;
  reversed: boolean;
  reversalReason: string | null;
}

// ── Bar Inventory ───────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  openingStock: number;
  currentStock: number;
  lowStockThreshold: number;
  pricePerUnit: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'waste';
  qty: number;
  reason: string;
  userId: string;
  createdAt: string;
}

// ── Audit ───────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
}

// ── OTA Settlements ─────────────────────────────────────────
export interface OtaSettlement {
  id: string;
  otaName: string;
  grossAmount: number;
  commissionDeducted: number;
  netReceived: number;
  transactionRef: string;
  bankDate: string;
  bookingIds: string[];
  notes: string;
  createdBy: string;
  createdAt: string;
}

// ── Expenses ────────────────────────────────────────────────
export type ExpenseCategory = 'Restaurant' | 'Resort Maintenance' | 'Petty Cash' | 'Inventory / Stock Purchase';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidTo: string;
  paymentMode: PaymentMode;
  receiptRef: string;
  date: string;
  inventoryItemId?: string;
  stockQty?: number;
  createdBy: string;
  createdAt: string;
}

// ── Bank Deposits ───────────────────────────────────────────
export interface BankDeposit {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  depositSlipRef: string;
  date: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

// ── Staff ────────────────────────────────────────────────────
export type StaffDepartment = 'Front Office' | 'Housekeeping' | 'Restaurant' | 'Bar' | 'Kitchen' | 'Maintenance' | 'Security' | 'Management' | 'Other';

export interface Staff {
  id: string;
  name: string;
  mobile: string;
  department: StaffDepartment;
  designation: string;
  joiningDate: string;
  salary: number;
  bankAccount: string;
  ifsc: string;
  aadhaar: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

// ── Salary Records ──────────────────────────────────────────
export interface SalaryRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: string;
  basicSalary: number;
  advance: number;
  deductions: number;
  bonus: number;
  netPay: number;
  paymentMode: PaymentMode;
  transactionRef: string;
  status: 'Pending' | 'Paid';
  paidDate: string;
  createdAt: string;
}

// ── Lease & Rent ────────────────────────────────────────────
export interface LeasePayment {
  id: string;
  description: string;
  landlord: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  paymentMode: PaymentMode;
  transactionRef: string;
  period: string;
  status: 'Pending' | 'Paid';
  createdAt: string;
}

// ── Settings ────────────────────────────────────────────────
export interface ResortSettings {
  resortName: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  defaultCreditLimit: number;
  defaultCleaningFee: number;
  sgstRate: number;
  cgstRate: number;
  lateCheckoutFee: number;
  checkoutTime: string;
  standardRate: number;
  deluxeRate: number;
  suiteRate: number;
  executiveRate: number;
  aggregators: { name: string; commissionPercent: number }[];
  userCredentials: { username: string; passwordHash: string; role: UserRole }[];
}

// ── App State ───────────────────────────────────────────────
export type UserRole = 'owner' | 'reception' | 'restaurant';

export interface AppState {
  isLoggedIn: boolean;
  role: UserRole;
  userName: string;
  rooms: Room[];
  customers: Customer[];
  bookings: Booking[];
  orders: Order[];
  menuItems: MenuItem[];
  payments: Payment[];
  serviceCharges: ServiceCharge[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  otaSettlements: OtaSettlement[];
  expenses: Expense[];
  bankDeposits: BankDeposit[];
  staff: Staff[];
  salaryRecords: SalaryRecord[];
  leasePayments: LeasePayment[];
  settings: ResortSettings;
}

export type PersistedAppState = Pick<
  AppState,
  | 'rooms'
  | 'customers'
  | 'bookings'
  | 'orders'
  | 'menuItems'
  | 'payments'
  | 'serviceCharges'
  | 'inventory'
  | 'stockMovements'
  | 'auditLogs'
  | 'otaSettlements'
  | 'expenses'
  | 'bankDeposits'
  | 'staff'
  | 'salaryRecords'
  | 'leasePayments'
  | 'settings'
>;
