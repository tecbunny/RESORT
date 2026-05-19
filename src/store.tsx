import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  AppState, UserRole, Room, Customer, Booking, Order,
  Payment, InventoryItem, StockMovement, AuditLog, ResortSettings,
  OrderItem, PaymentMode, RoomStatus, ServiceCharge, OtaSettlement, Expense, ExpenseCategory, BankDeposit,
  Staff, SalaryRecord, LeasePayment, PersistedAppState,
} from './types';
import {
  DEFAULT_SETTINGS, buildRooms, INITIAL_CUSTOMERS, INITIAL_BOOKINGS,
  INITIAL_ORDERS, INITIAL_MENU, INITIAL_PAYMENTS, INITIAL_INVENTORY,
  INITIAL_STOCK_MOVEMENTS, INITIAL_AUDIT_LOGS, INITIAL_SERVICE_CHARGES,
  INITIAL_OTA_SETTLEMENTS, INITIAL_EXPENSES, INITIAL_BANK_DEPOSITS,
  INITIAL_STAFF, INITIAL_SALARY_RECORDS, INITIAL_LEASE_PAYMENTS,
} from './data';
import {
  isSupabaseConfigured,
  fetchCollections,
  saveCollection,
  subscribeToCollections
} from './lib/supabaseClient';

// ── Helpers ───────────────────────────────────────────────
const DEFAULT_DB_STATE: PersistedAppState = {
  rooms: buildRooms(),
  customers: INITIAL_CUSTOMERS,
  bookings: INITIAL_BOOKINGS,
  orders: INITIAL_ORDERS,
  menuItems: INITIAL_MENU,
  payments: INITIAL_PAYMENTS,
  serviceCharges: INITIAL_SERVICE_CHARGES,
  inventory: INITIAL_INVENTORY,
  stockMovements: INITIAL_STOCK_MOVEMENTS,
  auditLogs: INITIAL_AUDIT_LOGS,
  otaSettlements: INITIAL_OTA_SETTLEMENTS,
  expenses: INITIAL_EXPENSES,
  bankDeposits: INITIAL_BANK_DEPOSITS,
  staff: INITIAL_STAFF,
  salaryRecords: INITIAL_SALARY_RECORDS,
  leasePayments: INITIAL_LEASE_PAYMENTS,
  settings: DEFAULT_SETTINGS,
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const tariffForCategory = (category: string, settings: ResortSettings) => {
  if (category === 'Suite') return settings.suiteRate;
  if (category === 'Deluxe') return settings.deluxeRate;
  if (category === 'Executive') return settings.executiveRate;
  return settings.standardRate;
};

const maxNumericId = (state: PersistedAppState) => {
  const ids = [
    ...state.customers.map(item => item.id),
    ...state.bookings.map(item => item.id),
    ...state.orders.map(item => item.id),
    ...state.menuItems.map(item => item.id),
    ...state.payments.map(item => item.id),
    ...state.serviceCharges.map(item => item.id),
    ...state.inventory.map(item => item.id),
    ...state.stockMovements.map(item => item.id),
    ...state.auditLogs.map(item => item.id),
  ];

  return ids.reduce((max, id) => {
    const match = id.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 5000);
};

// ── Context shape ─────────────────────────────────────────
interface StoreCtx extends AppState {
  supabaseLoading: boolean;
  supabaseConfigured: boolean;
  loginError: string;
  login: (username: string, password: string) => Promise<boolean>;
  setupInitialOwner: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Room ops
  updateRoomStatus: (id: string, status: RoomStatus, guest?: string | null) => void;
  checkInRoom: (roomId: string, name: string, mobile: string, idType: string, idNumber: string, idDocumentName?: string) => void;
  startCheckout: (roomId: string) => Room | undefined;
  collectPaymentForRoom: (roomId: string, amount: number, mode: PaymentMode, ref: string) => void;
  extendStay: (roomId: string, newCheckOutDate: string) => void;
  completeCheckout: (roomId: string) => Booking | undefined;
  requestCleaning: (roomId: string) => void;
  completeCleaning: (roomId: string) => void;
  markMaintenance: (roomId: string) => void;
  releaseMaintenance: (roomId: string) => void;
  // Restaurant ops
  createOrder: (roomNumber: string | null, customerName: string, items: OrderItem[], type: 'restaurant' | 'bar') => Order;
  payOrder: (orderId: string, mode: PaymentMode, ref: string) => void;
  postOrderToRoom: (orderId: string) => boolean;
  cancelOrder: (orderId: string, reason: string) => void;
  // Payment ops
  reversePayment: (paymentId: string, reason: string) => void;
  addServiceCharge: (roomId: string, description: string, amount: number) => void;
  addStockMovement: (itemId: string, type: StockMovement['type'], qty: number, reason: string) => void;
  importInventory: (items: {name: string, category: string, currentStock: number, unit: string, minStockLevel: number}[]) => void;
  // Reservation ops
  createReservation: (cust: { name: string; mobile: string }, roomId: string, checkIn: string, checkOut: string, advance: number, source?: 'Direct' | 'OTA', otaName?: string, otaReference?: string, otaCommission?: number) => void;
  confirmReservation: (bookingId: string) => void;
  cancelReservation: (bookingId: string) => void;
  // OTA Settlement
  recordOtaSettlement: (otaName: string, grossAmount: number, commissionDeducted: number, netReceived: number, transactionRef: string, bankDate: string, bookingIds: string[], notes: string) => void;
  // Expenses
  addExpense: (category: ExpenseCategory, description: string, amount: number, paidTo: string, paymentMode: PaymentMode, receiptRef: string, date: string, inventoryItemId?: string, stockQty?: number) => void;
  // Bank Deposits
  addBankDeposit: (amount: number, bankName: string, accountNumber: string, depositSlipRef: string, date: string, notes: string) => void;
  // Staff
  addStaff: (s: Omit<Staff, 'id' | 'createdAt'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  // Salary
  processSalary: (staffId: string, month: string, advance: number, deductions: number, bonus: number, paymentMode: PaymentMode, transactionRef: string) => void;
  // Lease
  addLeasePayment: (description: string, landlord: string, amount: number, dueDate: string, period: string) => void;
  markLeasePaid: (id: string, paymentMode: PaymentMode, transactionRef: string) => void;
  // Settings
  updateSettings: (s: Partial<ResortSettings>) => void;
  // Audit
  addAuditLog: (action: string, entity: string, entityId: string, oldVal: string, newVal: string, reason: string) => void;
}

const StoreContext = createContext<StoreCtx | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initialDb] = useState(DEFAULT_DB_STATE);
  const idCounterRef = useRef(maxNumericId(initialDb));
  const nextId = useCallback((prefix: string) => `${prefix}-${++idCounterRef.current}`, []);
  const isPositiveAmount = (value: number) => Number.isFinite(value) && value > 0;
  const isNonNegativeAmount = (value: number) => Number.isFinite(value) && value >= 0;

  // ── Session persistence (2hr inactivity timeout) ───────
  const SESSION_KEY = 'resort-management.session';
  const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

  const loadSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as { userName: string; role: UserRole; lastActivity: number; token: string };
      if (Date.now() - session.lastActivity > SESSION_TIMEOUT_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      // Validate token format (simple integrity check)
      if (!session.token || session.token.length < 16) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch { return null; }
  };

  const generateToken = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  };

  const [savedSession] = useState(() => {
    const session = loadSession();
    const sessionUser = session && initialDb.settings.userCredentials.find(
      credential => credential.username === session.userName && credential.role === session.role
    );
    if (!session || sessionUser) return session;
    localStorage.removeItem(SESSION_KEY);
    return null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!savedSession);
  const [role, setRole] = useState<UserRole>(savedSession?.role || 'reception');
  const [userName, setUserName] = useState(savedSession?.userName || '');
  const [loginError, setLoginError] = useState('');
  const isOwner = role === 'owner';
  const canUseReception = role === 'owner' || role === 'reception';
  const canUseOperations = role === 'owner' || role === 'reception' || role === 'restaurant';

  // Keep session alive on user interaction (throttled to max once per 30s)
  useEffect(() => {
    if (!isLoggedIn) return;
    let lastSave = 0;
    const saveActivity = () => {
      const now = Date.now();
      if (now - lastSave < 30000) return; // throttle: max once per 30s
      lastSave = now;
      try {
        const existing = localStorage.getItem(SESSION_KEY);
        if (existing) {
          const parsed = JSON.parse(existing);
          parsed.lastActivity = now;
          localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
        }
      } catch { /* ignore */ }
    };
    saveActivity();
    const events = ['click', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, saveActivity));
    return () => { events.forEach(e => window.removeEventListener(e, saveActivity)); };
  }, [isLoggedIn]);

  const [rooms, setRooms] = useState<Room[]>(initialDb.rooms);
  const [customers, setCustomers] = useState<Customer[]>(initialDb.customers);
  const [bookings, setBookings] = useState<Booking[]>(initialDb.bookings);
  const [orders, setOrders] = useState<Order[]>(initialDb.orders);
  const [menuItems] = useState(initialDb.menuItems);
  const [payments, setPayments] = useState<Payment[]>(initialDb.payments);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>(initialDb.serviceCharges);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialDb.inventory);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialDb.stockMovements);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialDb.auditLogs);
  const [otaSettlements, setOtaSettlements] = useState<OtaSettlement[]>(initialDb.otaSettlements || []);
  const [expenses, setExpenses] = useState<Expense[]>(initialDb.expenses || []);
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>(initialDb.bankDeposits || []);
  const [staffList, setStaffList] = useState<Staff[]>(initialDb.staff || []);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(initialDb.salaryRecords || []);
  const [leasePayments, setLeasePayments] = useState<LeasePayment[]>(initialDb.leasePayments || []);
  const [settings, setSettings] = useState<ResortSettings>(initialDb.settings);

  const [supabaseLoading, setSupabaseLoading] = useState(isSupabaseConfigured());
  const supabaseConfigured = isSupabaseConfigured();
  const isRemoteChangeRef = useRef<Record<string, boolean>>({});

  // Startup data load and realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    async function loadCloudData() {
      try {
        const cloudData = await fetchCollections();
        if (Object.keys(cloudData).length > 0) {
          // Set flags so initial loads don't trigger immediate writes
          Object.keys(cloudData).forEach(name => {
            isRemoteChangeRef.current[name] = true;
          });

          if (cloudData.rooms) setRooms(cloudData.rooms);
          if (cloudData.customers) setCustomers(cloudData.customers);
          if (cloudData.bookings) setBookings(cloudData.bookings);
          if (cloudData.orders) setOrders(cloudData.orders);
          if (cloudData.payments) setPayments(cloudData.payments);
          if (cloudData.serviceCharges) setServiceCharges(cloudData.serviceCharges);
          if (cloudData.inventory) setInventory(cloudData.inventory);
          if (cloudData.stockMovements) setStockMovements(cloudData.stockMovements);
          if (cloudData.auditLogs) setAuditLogs(cloudData.auditLogs);
          if (cloudData.otaSettlements) setOtaSettlements(cloudData.otaSettlements);
          if (cloudData.expenses) setExpenses(cloudData.expenses);
          if (cloudData.bankDeposits) setBankDeposits(cloudData.bankDeposits);
          if (cloudData.staff) setStaffList(cloudData.staff);
          if (cloudData.salaryRecords) setSalaryRecords(cloudData.salaryRecords);
          if (cloudData.leasePayments) setLeasePayments(cloudData.leasePayments);
          if (cloudData.settings) setSettings(cloudData.settings);
        } else {
          // Supabase is empty, check if there's local data to migrate!
          const localRaw = localStorage.getItem('resort-management.db');
          if (localRaw) {
            try {
              const localData = JSON.parse(localRaw);
              console.log('Detected local data. Starting automated migration to Supabase cloud...');
              
              const collectionsToMigrate = [
                { name: 'rooms', data: localData.rooms },
                { name: 'customers', data: localData.customers },
                { name: 'bookings', data: localData.bookings },
                { name: 'orders', data: localData.orders },
                { name: 'payments', data: localData.payments },
                { name: 'serviceCharges', data: localData.serviceCharges },
                { name: 'inventory', data: localData.inventory },
                { name: 'stockMovements', data: localData.stockMovements },
                { name: 'auditLogs', data: localData.auditLogs },
                { name: 'otaSettlements', data: localData.otaSettlements },
                { name: 'expenses', data: localData.expenses },
                { name: 'bankDeposits', data: localData.bankDeposits },
                { name: 'staff', data: localData.staff },
                { name: 'salaryRecords', data: localData.salaryRecords },
                { name: 'leasePayments', data: localData.leasePayments },
                { name: 'settings', data: localData.settings },
              ];

              for (const col of collectionsToMigrate) {
                if (col.data) {
                  await saveCollection(col.name, col.data);
                }
              }
              
              console.log('Automated migration to Supabase cloud completed successfully!');
              
              if (localData.rooms) setRooms(localData.rooms);
              if (localData.customers) setCustomers(localData.customers);
              if (localData.bookings) setBookings(localData.bookings);
              if (localData.orders) setOrders(localData.orders);
              if (localData.payments) setPayments(localData.payments);
              if (localData.serviceCharges) setServiceCharges(localData.serviceCharges);
              if (localData.inventory) setInventory(localData.inventory);
              if (localData.stockMovements) setStockMovements(localData.stockMovements);
              if (localData.auditLogs) setAuditLogs(localData.auditLogs);
              if (localData.otaSettlements) setOtaSettlements(localData.otaSettlements);
              if (localData.expenses) setExpenses(localData.expenses);
              if (localData.bankDeposits) setBankDeposits(localData.bankDeposits);
              if (localData.staff) setStaffList(localData.staff);
              if (localData.salaryRecords) setSalaryRecords(localData.salaryRecords);
              if (localData.leasePayments) setLeasePayments(localData.leasePayments);
              if (localData.settings) setSettings(localData.settings);
            } catch (migrationErr) {
              console.error('Failed to migrate local data to Supabase:', migrationErr);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load cloud data from Supabase:', err);
      } finally {
        setSupabaseLoading(false);
      }
    }

    loadCloudData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToCollections((name, data) => {
      isRemoteChangeRef.current[name] = true;
      switch (name) {
        case 'rooms': setRooms(data); break;
        case 'customers': setCustomers(data); break;
        case 'bookings': setBookings(data); break;
        case 'orders': setOrders(data); break;
        case 'payments': setPayments(data); break;
        case 'serviceCharges': setServiceCharges(data); break;
        case 'inventory': setInventory(data); break;
        case 'stockMovements': setStockMovements(data); break;
        case 'auditLogs': setAuditLogs(data); break;
        case 'otaSettlements': setOtaSettlements(data); break;
        case 'expenses': setExpenses(data); break;
        case 'bankDeposits': setBankDeposits(data); break;
        case 'staff': setStaffList(data); break;
        case 'salaryRecords': setSalaryRecords(data); break;
        case 'leasePayments': setLeasePayments(data); break;
        case 'settings': setSettings(data); break;
      }
    });

    return () => unsubscribe();
  }, []);

  const syncCollection = useCallback((name: string, data: any) => {
    if (isRemoteChangeRef.current[name]) {
      isRemoteChangeRef.current[name] = false;
      return;
    }
    saveCollection(name, data);
  }, []);

  useEffect(() => { syncCollection('rooms', rooms); }, [rooms, syncCollection]);
  useEffect(() => { syncCollection('customers', customers); }, [customers, syncCollection]);
  useEffect(() => { syncCollection('bookings', bookings); }, [bookings, syncCollection]);
  useEffect(() => { syncCollection('orders', orders); }, [orders, syncCollection]);
  useEffect(() => { syncCollection('payments', payments); }, [payments, syncCollection]);
  useEffect(() => { syncCollection('serviceCharges', serviceCharges); }, [serviceCharges, syncCollection]);
  useEffect(() => { syncCollection('inventory', inventory); }, [inventory, syncCollection]);
  useEffect(() => { syncCollection('stockMovements', stockMovements); }, [stockMovements, syncCollection]);
  useEffect(() => { syncCollection('auditLogs', auditLogs); }, [auditLogs, syncCollection]);
  useEffect(() => { syncCollection('otaSettlements', otaSettlements); }, [otaSettlements, syncCollection]);
  useEffect(() => { syncCollection('expenses', expenses); }, [expenses, syncCollection]);
  useEffect(() => { syncCollection('bankDeposits', bankDeposits); }, [bankDeposits, syncCollection]);
  useEffect(() => { syncCollection('staff', staffList); }, [staffList, syncCollection]);
  useEffect(() => { syncCollection('salaryRecords', salaryRecords); }, [salaryRecords, syncCollection]);
  useEffect(() => { syncCollection('leasePayments', leasePayments); }, [leasePayments, syncCollection]);
  useEffect(() => { syncCollection('settings', settings); }, [settings, syncCollection]);



  // ── SHA-256 hash utility ───────────────────────────────
  const hashPassword = useCallback(async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const createPasswordHash = useCallback(async (password: string): Promise<string> => {
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const salt = Array.from(saltBytes, b => b.toString(16).padStart(2, '0')).join('');
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 150000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const hash = Array.from(new Uint8Array(derivedBits), b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2$150000$${salt}$${hash}`;
  }, []);

  const verifyPassword = useCallback(async (password: string, storedHash: string): Promise<boolean> => {
    if (!storedHash.startsWith('pbkdf2$')) {
      return await hashPassword(password) === storedHash;
    }

    const [, iterationsText, salt, expectedHash] = storedHash.split('$');
    const iterations = Number(iterationsText);
    if (!iterations || !salt || !expectedHash) return false;

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const hash = Array.from(new Uint8Array(derivedBits), b => b.toString(16).padStart(2, '0')).join('');
    return hash === expectedHash;
  }, [hashPassword]);

  // ── Auth ────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const creds = settings.userCredentials || [];
    const user = creds.find(c => c.username.toLowerCase() === username.toLowerCase());
    const match = user && await verifyPassword(password, user.passwordHash) ? user : null;
    if (!match) {
      setLoginError('Invalid username or password');
      return false;
    }
    setRole(match.role);
    setUserName(match.username);
    setIsLoggedIn(true);
    setLoginError('');
    const token = generateToken();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userName: match.username, role: match.role, lastActivity: Date.now(), token }));
    return true;
  }, [settings, verifyPassword]);

  const setupInitialOwner = useCallback(async (username: string, password: string): Promise<boolean> => {
    if ((settings.userCredentials || []).length > 0) return false;
    const cleanUsername = username.trim() || 'owner';
    if (password.length < 8) {
      setLoginError('Use at least 8 characters for the owner password.');
      return false;
    }

    const passwordHash = await createPasswordHash(password);
    setSettings(prev => ({
      ...prev,
      userCredentials: [{ username: cleanUsername, passwordHash, role: 'owner' }],
    }));
    setRole('owner');
    setUserName(cleanUsername);
    setIsLoggedIn(true);
    setLoginError('');
    const token = generateToken();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userName: cleanUsername, role: 'owner', lastActivity: Date.now(), token }));
    return true;
  }, [settings.userCredentials, createPasswordHash]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUserName('');
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addAuditLog = useCallback((action: string, entity: string, entityId: string, oldVal: string, newVal: string, reason: string) => {
    setAuditLogs(prev => [{ id: nextId('AL'), userId: role, userName: userName || role, action, entity, entityId, oldValue: oldVal, newValue: newVal, reason, createdAt: now() }, ...prev]);
  }, [role, userName, nextId]);

  // ── Room operations ─────────────────────────────────────
  const updateRoomStatus = useCallback((id: string, status: RoomStatus, guest?: string | null) => {
    if (!canUseReception) return;
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status, guest: guest !== undefined ? guest : r.guest } : r));
  }, [canUseReception]);

  const checkInRoom = useCallback((roomId: string, name: string, mobile: string, idType: string, idNumber: string, idDocumentName = '') => {
    if (!canUseReception) return;
    if (!roomId || !name.trim() || !mobile.trim() || !idType.trim() || !idNumber.trim()) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Upsert customer
    const existing = customers.find(c => c.mobile === mobile);
    const activeReservation = room.status === 'blue'
      ? bookings.find(b => b.roomId === roomId && b.status === 'reserved' && b.mobile === mobile)
      : undefined;
    const custId = existing ? existing.id : activeReservation?.customerId || nextId('C');
    if (!existing) {
      setCustomers(prev => [...prev, { id: custId, name, mobile, idType, idNumber, idDocumentName, address: '', lastVisit: today(), status: 'In-House', stays: 1 }]);
    } else {
      setCustomers(prev => prev.map(c => c.id === custId ? { ...c, name, idType, idNumber, idDocumentName, status: 'In-House', lastVisit: today(), stays: c.stays + 1 } : c));
    }

    // Create booking
    const bId = activeReservation?.id || nextId('B');
    const tariff = activeReservation?.tariff || tariffForCategory(room.category, settings);
    if (activeReservation) {
      setBookings(prev => prev.map(b => b.id === activeReservation.id ? { ...b, status: 'active', customerName: name, mobile, checkIn: today(), totalBilled: tariff, totalPaid: b.advance } : b));
    } else {
      setBookings(prev => [...prev, {
        id: bId, customerId: custId, customerName: name, mobile, roomId, roomNumber: room.number,
        category: room.category, status: 'active', checkIn: today(),
        checkOut: '', guests: 1, tariff, advance: 0, totalBilled: tariff, totalPaid: 0,
        creditLimit: settings.defaultCreditLimit, source: 'Direct', createdAt: now(),
      }]);
    }

    // Update room
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'red' as const, guest: name, guestMobile: mobile, bookingId: bId, bill: Math.max(0, tariff - (activeReservation?.advance || 0)), cleaningsToday: 0 } : r));
  }, [canUseReception, rooms, customers, bookings, settings, nextId]);

  const startCheckout = useCallback((roomId: string) => rooms.find(r => r.id === roomId), [rooms]);

  const collectPaymentForRoom = useCallback((roomId: string, amount: number, mode: PaymentMode, ref: string) => {
    if (!canUseReception) return;
    if (!roomId || !isPositiveAmount(amount)) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.bookingId) return;

    setPayments(prev => [...prev, { id: nextId('PAY'), bookingId: room.bookingId, orderId: null, amount, mode, transactionRef: ref, collectedBy: userName || role, createdAt: now(), reversed: false, reversalReason: null }]);
    setBookings(prev => prev.map(b => b.id === room.bookingId ? { ...b, totalPaid: b.totalPaid + amount } : b));
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, bill: Math.max(0, r.bill - amount) } : r));
  }, [canUseReception, rooms, userName, role, nextId]);

  const extendStay = useCallback((roomId: string, newCheckOutDate: string) => {
    if (!canUseReception) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.bookingId) return;
    setBookings(prev => prev.map(b => {
      if (b.id === room.bookingId) {
        addAuditLog('Extend Stay', 'Booking', b.id, b.checkOut, newCheckOutDate, 'Guest extended stay');
        return { ...b, checkOut: newCheckOutDate };
      }
      return b;
    }));
  }, [canUseReception, rooms, addAuditLog]);

  const completeCheckout = useCallback((roomId: string): Booking | undefined => {
    if (!canUseReception) return undefined;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return undefined;

    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'yellow' as const, guest: null, guestMobile: null, bookingId: null, bill: 0, cleaningsToday: 0 } : r));
    let booking: Booking | undefined;
    setBookings(prev => prev.map(b => {
      if (b.id === room.bookingId) {
        booking = { ...b, status: 'settled', checkOut: today() };
        return booking;
      }
      return b;
    }));
    if (room.guestMobile) {
      setCustomers(prev => prev.map(c => c.mobile === room.guestMobile ? { ...c, status: 'Active' } : c));
    }
    addAuditLog('Checkout', 'Booking', room.bookingId || '', 'Active', 'Settled', 'Guest checkout completed');
    return booking;
  }, [canUseReception, rooms, addAuditLog]);

  const addServiceCharge = useCallback((roomId: string, description: string, amount: number) => {
    if (!canUseReception) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room?.bookingId || !isPositiveAmount(amount) || !description.trim()) return;
    const charge: ServiceCharge = {
      id: nextId('SC'),
      bookingId: room.bookingId,
      roomId,
      roomNumber: room.number,
      description: description.trim(),
      amount,
      createdBy: userName || role,
      createdAt: now(),
    };
    setServiceCharges(prev => [charge, ...prev]);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, bill: r.bill + amount } : r));
    setBookings(prev => prev.map(b => b.id === room.bookingId ? { ...b, totalBilled: b.totalBilled + amount } : b));
    addAuditLog('Service Charge Added', 'Booking', room.bookingId, 'No charge', `${amount}`, description);
  }, [canUseReception, rooms, role, userName, addAuditLog, nextId]);

  // ── Housekeeping ────────────────────────────────────────
  const requestCleaning = useCallback((roomId: string) => {
    if (!canUseReception) return;
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId || r.status !== 'red') return r;
      const extra = r.cleaningsToday >= 1;
      const newBill = extra ? r.bill + settings.defaultCleaningFee : r.bill;
      if (extra && r.bookingId) {
        setBookings(bk => bk.map(b => b.id === r.bookingId ? { ...b, totalBilled: b.totalBilled + settings.defaultCleaningFee } : b));
      }
      return { ...r, status: 'pink' as const, cleaningsToday: r.cleaningsToday + 1, bill: newBill };
    }));
  }, [canUseReception, settings.defaultCleaningFee]);

  const completeCleaning = useCallback((roomId: string) => {
    if (!canUseReception) return;
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      if (r.status === 'pink') return { ...r, status: 'red' as const };
      if (r.status === 'yellow') {
        const hasReservation = bookings.some(b => b.status === 'reserved' && b.roomId === roomId && b.checkIn <= new Date().toISOString().slice(0, 10));
        return { ...r, status: hasReservation ? 'blue' as const : 'green' as const };
      }
      return r;
    }));
  }, [canUseReception, bookings]);

  const markMaintenance = useCallback((roomId: string) => {
    if (!canUseReception) return;
    setRooms(prev => prev.map(r => r.id === roomId && ['green', 'yellow'].includes(r.status) ? { ...r, status: 'grey' as const } : r));
  }, [canUseReception]);

  const releaseMaintenance = useCallback((roomId: string) => {
    if (!canUseReception) return;
    setRooms(prev => prev.map(r => r.id === roomId && r.status === 'grey' ? { ...r, status: 'green' as const } : r));
  }, [canUseReception]);

  // ── Restaurant orders ───────────────────────────────────
  const createOrder = useCallback((roomNumber: string | null, customerName: string, items: OrderItem[], type: 'restaurant' | 'bar'): Order => {
    if (!canUseOperations || items.length === 0) {
      return {
        id: '', bookingId: null, roomNumber, customerName, items: [],
        subtotal: 0, taxTotal: 0, total: 0, status: 'cancelled', paymentMode: null,
        createdAt: now(), type,
      };
    }
    const booking = roomNumber ? bookings.find(b => b.roomNumber === roomNumber && b.status === 'active') : null;
    const order: Order = {
      id: nextId('ORD'), bookingId: booking?.id || null, roomNumber, customerName,
      items, subtotal: items.reduce((a, i) => a + i.rate * i.qty, 0),
      taxTotal: items.reduce((a, i) => a + i.tax, 0),
      total: items.reduce((a, i) => a + i.total, 0),
      status: 'active', paymentMode: null, createdAt: now(), type,
    };
    setOrders(prev => [...prev, order]);

    // Deduct bar inventory automatically
    if (type === 'bar') {
      for (const item of items) {
        const inv = inventory.find(inv => inv.name.toLowerCase().includes(item.name.split(' (')[0].toLowerCase()));
        if (inv) {
          setInventory(prev => prev.map(i => i.id === inv.id ? { ...i, currentStock: Math.max(0, i.currentStock - item.qty) } : i));
          setStockMovements(prev => [...prev, { id: nextId('SM'), itemId: inv.id, itemName: inv.name, type: 'sale', qty: item.qty, reason: `Bar order ${order.id}`, userId: userName || role, createdAt: now() }]);
        }
      }
    }
    return order;
  }, [canUseOperations, bookings, inventory, userName, role, nextId]);

  const payOrder = useCallback((orderId: string, mode: PaymentMode, ref: string) => {
    if (!canUseOperations) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'paid', paymentMode: mode } : o));
    setPayments(prev => [...prev, { id: nextId('PAY'), bookingId: order.bookingId, orderId, amount: order.total, mode, transactionRef: ref, collectedBy: userName || role, createdAt: now(), reversed: false, reversalReason: null }]);
  }, [canUseOperations, orders, userName, role, nextId]);

  const postOrderToRoom = useCallback((orderId: string): boolean => {
    if (!canUseOperations) return false;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.bookingId) return false;
    const booking = bookings.find(b => b.id === order.bookingId);
    if (!booking) return false;

    const unpaidCredit = orders.filter(o => o.bookingId === booking.id && o.status === 'posted').reduce((a, o) => a + o.total, 0);
    if (unpaidCredit + order.total > booking.creditLimit) return false;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'posted' } : o));
    setRooms(prev => prev.map(r => r.bookingId === booking.id ? { ...r, bill: r.bill + order.total } : r));
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, totalBilled: b.totalBilled + order.total } : b));
    return true;
  }, [canUseOperations, orders, bookings]);

  const cancelOrder = useCallback((orderId: string, reason: string) => {
    if (!canUseOperations) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    addAuditLog('Bill Cancelled', 'Order', orderId, 'Active', 'Cancelled', reason);
  }, [canUseOperations, addAuditLog]);

  // ── Payment reversal ────────────────────────────────────
  const reversePayment = useCallback((paymentId: string, reason: string) => {
    if (!isOwner) return;
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, reversed: true, reversalReason: reason } : p));
    if (payment.bookingId) {
      setBookings(prev => prev.map(b => b.id === payment.bookingId ? { ...b, totalPaid: b.totalPaid - payment.amount } : b));
    }
    addAuditLog('Payment Reversal', 'Payment', paymentId, `₹${payment.amount} ${payment.mode}`, 'Reversed', reason);
  }, [isOwner, payments, addAuditLog]);

  // ── Inventory ───────────────────────────────────────────
  const addStockMovement = useCallback((itemId: string, type: StockMovement['type'], qty: number, reason: string) => {
    if (!canUseOperations) return;
    if (!itemId || !isPositiveAmount(qty)) return;
    setStockMovements(prev => [...prev, { id: nextId('SM'), itemId, itemName: inventory.find(i => i.id === itemId)?.name || '', type, qty, reason, userId: userName || role, createdAt: now() }]);
    setInventory(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      if (type === 'purchase') return { ...i, currentStock: i.currentStock + qty };
      return { ...i, currentStock: Math.max(0, i.currentStock - qty) };
    }));
  }, [canUseOperations, inventory, userName, role, nextId]);

  const importInventory = useCallback((items: {name: string, category: string, currentStock: number, unit: string, minStockLevel: number}[]) => {
    if (!canUseOperations) return;
    setInventory(prev => {
      const newInv = [...prev];
      items.filter(item => item.name.trim() && isNonNegativeAmount(item.currentStock) && isNonNegativeAmount(item.minStockLevel)).forEach(item => {
        const existing = newInv.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          existing.currentStock += item.currentStock;
          if (item.minStockLevel) existing.lowStockThreshold = item.minStockLevel;
        } else {
          newInv.push({
            id: nextId('INV'),
            name: item.name,
            category: item.category,
            unit: item.unit,
            openingStock: item.currentStock,
            currentStock: item.currentStock,
            lowStockThreshold: item.minStockLevel || 10,
            pricePerUnit: 0
          });
        }
      });
      return newInv;
    });
    addAuditLog('CSV Import', 'Inventory', 'Bulk', 'N/A', `${items.length} items`, 'Bulk inventory upload via CSV');
  }, [canUseOperations, addAuditLog, nextId]);

  // ── Reservations ────────────────────────────────────────
  const createReservation = useCallback((cust: { name: string; mobile: string }, roomId: string, checkIn: string, checkOut: string, advance: number, source: 'Direct' | 'OTA' = 'Direct', otaName?: string, otaReference?: string, otaCommission?: number) => {
    if (!canUseReception) return;
    if (!cust.name.trim() || !cust.mobile.trim() || !roomId || !checkIn || !checkOut || checkOut < checkIn || !isNonNegativeAmount(advance)) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const custId = nextId('C');
    const bId = nextId('B');
    const tariff = tariffForCategory(room.category, settings);

    setBookings(prev => [...prev, {
      id: bId, customerId: custId, customerName: cust.name, mobile: cust.mobile, roomId, roomNumber: room.number,
      category: room.category, status: 'reserved', checkIn, checkOut, guests: 1, tariff, advance, totalBilled: 0, totalPaid: advance,
      creditLimit: settings.defaultCreditLimit, source, otaName, otaReference, otaCommission, createdAt: now(),
    }]);

    if (checkIn <= new Date().toISOString().slice(0, 10) && room.status === 'green') {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'blue' as const } : r));
    }

    if (advance > 0) {
      const mode: PaymentMode = source === 'OTA' ? 'OTA Collect' : 'Cash';
      setPayments(prev => [...prev, { id: nextId('PAY'), bookingId: bId, orderId: null, amount: advance, mode, transactionRef: otaReference || '', collectedBy: userName || role, createdAt: now(), reversed: false, reversalReason: null }]);
    }
  }, [canUseReception, rooms, settings, userName, role, nextId]);

  const confirmReservation = useCallback((bookingId: string) => {
    if (!canUseReception) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'active' } : b));
    setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, status: 'red' as const, guest: booking.customerName, guestMobile: booking.mobile, bookingId: booking.id, bill: booking.tariff } : r));
  }, [canUseReception, bookings]);

  const cancelReservation = useCallback((bookingId: string) => {
    if (!canUseReception) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    setRooms(prev => prev.map(r => r.id === booking.roomId && r.status === 'blue' ? { ...r, status: 'green' as const } : r));
  }, [canUseReception, bookings]);

  // ── Settings ────────────────────────────────────────────
  const updateSettings = useCallback((s: Partial<ResortSettings>) => {
    if (!isOwner) return;
    setSettings(prev => ({ ...prev, ...s }));
  }, [isOwner]);

  // ── OTA Settlement ─────────────────────────────────────
  const recordOtaSettlement = useCallback((otaName: string, grossAmount: number, commissionDeducted: number, netReceived: number, transactionRef: string, bankDate: string, bookingIds: string[], notes: string) => {
    if (!canUseReception) return;
    if (!otaName.trim() || !bankDate || !isPositiveAmount(grossAmount) || !isNonNegativeAmount(commissionDeducted) || !isNonNegativeAmount(netReceived) || commissionDeducted > grossAmount || netReceived > grossAmount) return;
    const settlement: OtaSettlement = {
      id: nextId('OTA'), otaName, grossAmount, commissionDeducted, netReceived,
      transactionRef, bankDate, bookingIds, notes,
      createdBy: userName || role, createdAt: now(),
    };
    setOtaSettlements(prev => [settlement, ...prev]);
    addAuditLog('OTA Settlement', 'OtaSettlement', settlement.id, 'Pending', `₹${netReceived} received`, `${otaName} settled via ${transactionRef}`);
  }, [canUseReception, userName, role, nextId, addAuditLog]);

  // ── Expenses ───────────────────────────────────────────
  const addExpense = useCallback((category: ExpenseCategory, description: string, amount: number, paidTo: string, paymentMode: PaymentMode, receiptRef: string, date: string, inventoryItemId?: string, stockQty?: number) => {
    if (!canUseReception) return;
    if (!description.trim() || !isPositiveAmount(amount) || !date) return;
    if (stockQty !== undefined && !isPositiveAmount(stockQty)) return;
    if (stockQty !== undefined && !inventoryItemId) return;
    const expense: Expense = {
      id: nextId('EXP'), category, description, amount, paidTo, paymentMode, receiptRef, date,
      inventoryItemId, stockQty,
      createdBy: userName || role, createdAt: now(),
    };
    setExpenses(prev => [expense, ...prev]);
    // Auto-update inventory stock if this is a stock purchase
    if (inventoryItemId && stockQty && stockQty > 0) {
      setInventory(prev => prev.map(i => i.id === inventoryItemId ? { ...i, currentStock: i.currentStock + stockQty } : i));
      setStockMovements(prev => [...prev, { id: nextId('SM'), itemId: inventoryItemId, itemName: inventory.find(i => i.id === inventoryItemId)?.name || '', type: 'purchase', qty: stockQty, reason: `Purchase: ${description}`, userId: userName || role, createdAt: now() }]);
    }
    addAuditLog('Expense Added', 'Expense', expense.id, 'N/A', `₹${amount}`, `${category}: ${description}`);
  }, [canUseReception, userName, role, nextId, addAuditLog, inventory]);

  // ── Bank Deposits ──────────────────────────────────────
  const addBankDeposit = useCallback((amount: number, bankName: string, accountNumber: string, depositSlipRef: string, date: string, notes: string) => {
    if (!canUseReception) return;
    if (!isPositiveAmount(amount) || !bankName.trim() || !date) return;
    const deposit: BankDeposit = {
      id: nextId('DEP'), amount, bankName, accountNumber, depositSlipRef, date, notes,
      createdBy: userName || role, createdAt: now(),
    };
    setBankDeposits(prev => [deposit, ...prev]);
    addAuditLog('Bank Deposit', 'BankDeposit', deposit.id, 'Cash', `₹${amount} → ${bankName}`, notes || 'Cash deposited to bank');
  }, [canUseReception, userName, role, nextId, addAuditLog]);

  // ── Staff Management ───────────────────────────────────
  const addStaff = useCallback((s: Omit<Staff, 'id' | 'createdAt'>) => {
    if (!isOwner) return;
    if (!s.name.trim() || !isNonNegativeAmount(s.salary)) return;
    setStaffList(prev => [...prev, { ...s, id: nextId('STF'), createdAt: now() }]);
  }, [isOwner, nextId]);

  const updateStaff = useCallback((id: string, updates: Partial<Staff>) => {
    if (!isOwner) return;
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [isOwner]);

  // ── Salary Processing ──────────────────────────────────
  const processSalary = useCallback((staffId: string, month: string, advance: number, deductions: number, bonus: number, paymentMode: PaymentMode, transactionRef: string) => {
    if (!isOwner) return;
    if (!staffId || !month || !isNonNegativeAmount(advance) || !isNonNegativeAmount(deductions) || !isNonNegativeAmount(bonus)) return;
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    const netPay = staff.salary + bonus - advance - deductions;
    const record: SalaryRecord = {
      id: nextId('SAL'), staffId, staffName: staff.name, month,
      basicSalary: staff.salary, advance, deductions, bonus, netPay,
      paymentMode, transactionRef, status: 'Paid',
      paidDate: new Date().toISOString().slice(0, 10), createdAt: now(),
    };
    setSalaryRecords(prev => [record, ...prev]);
    addAuditLog('Salary Paid', 'SalaryRecord', record.id, 'Pending', `₹${netPay}`, `${staff.name} - ${month}`);
  }, [isOwner, staffList, nextId, addAuditLog]);

  // ── Lease & Rent ───────────────────────────────────────
  const addLeasePayment = useCallback((description: string, landlord: string, amount: number, dueDate: string, period: string) => {
    if (!isOwner) return;
    if (!description.trim() || !isPositiveAmount(amount) || !dueDate || !period.trim()) return;
    setLeasePayments(prev => [...prev, {
      id: nextId('LEASE'), description, landlord, amount, dueDate,
      paidDate: '', paymentMode: 'Cash' as PaymentMode, transactionRef: '',
      period, status: 'Pending', createdAt: now(),
    }]);
  }, [isOwner, nextId]);

  const markLeasePaid = useCallback((id: string, paymentMode: PaymentMode, transactionRef: string) => {
    if (!isOwner) return;
    if (!id) return;
    setLeasePayments(prev => prev.map(l => l.id === id ? { ...l, status: 'Paid' as const, paymentMode, transactionRef, paidDate: new Date().toISOString().slice(0, 10) } : l));
    addAuditLog('Lease Paid', 'LeasePayment', id, 'Pending', 'Paid', transactionRef);
  }, [isOwner, addAuditLog]);

  // ── Audit ───────────────────────────────────────────────
  const value: StoreCtx = {
    supabaseLoading, supabaseConfigured,
    isLoggedIn, role, userName, rooms, customers, bookings, orders, menuItems, payments, serviceCharges, inventory, stockMovements, auditLogs, otaSettlements, expenses, bankDeposits, staff: staffList, salaryRecords, leasePayments, settings,
    loginError, login, setupInitialOwner, logout,
    updateRoomStatus, checkInRoom, startCheckout, collectPaymentForRoom, extendStay, completeCheckout,
    requestCleaning, completeCleaning, markMaintenance, releaseMaintenance,
    createOrder, payOrder, postOrderToRoom, cancelOrder,
    reversePayment, addServiceCharge, addStockMovement, importInventory,
    createReservation, confirmReservation, cancelReservation,
    recordOtaSettlement, addExpense, addBankDeposit,
    addStaff, updateStaff, processSalary, addLeasePayment, markLeasePaid,
    updateSettings, addAuditLog,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
