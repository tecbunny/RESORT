import { useState } from 'react';
import {
  LayoutDashboard, BedDouble, Users, UtensilsCrossed, Beer, Wallet,
  FileText, Settings, Bell, Search, Menu, LogOut, Lock, User, CalendarCheck, Receipt, Landmark, UsersRound,
  Cloud, CloudOff
} from 'lucide-react';
import './App.css';
import { useStore } from './store';

// Tab Components
import DashboardTab from './tabs/DashboardTab';
import CustomersTab from './tabs/CustomersTab';
import RestaurantTab from './tabs/RestaurantTab';
import BarTab from './tabs/BarTab';
import PaymentsTab from './tabs/PaymentsTab';
import ReportsTab from './tabs/ReportsTab';
import ReservationsTab from './tabs/ReservationsTab';
import ExpensesTab from './tabs/ExpensesTab';
import AccountsTab from './tabs/AccountsTab';
import StaffTab from './tabs/StaffTab';
import SettingsTab from './tabs/SettingsTab';

function App() {
  const {
    isLoggedIn, role, userName, login, logout, loginError, settings, rooms,
    supabaseLoading, supabaseConfigured
  } = useStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const alertCount = rooms.filter(room => room.status === 'pink' || room.status === 'yellow' || room.status === 'grey').length;

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    setSidebarOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = loginForm.username.trim().toLowerCase();
    const loggedIn = await login(username, loginForm.password);
    if (!loggedIn) return;
    setActiveTab(username === 'restaurant' ? 'restaurant' : 'dashboard');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="glass-panel login-card animate-fade-in">
          <div className="login-header flex-center">
            <div className="brand-logo"><BedDouble size={28} className="brand-icon" /></div>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{settings.resortName} System</h2>
          
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input required type="text" className="form-input with-icon" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="Username" />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input required type="password" className="form-input with-icon" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Password" />
              </div>
            </div>
            {loginError && <p className="text-red" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{loginError}</p>}
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ marginTop: '1rem' }}
              disabled={supabaseLoading}
            >
              {supabaseLoading ? 'Connecting to Cloud...' : 'Login to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'customers': return <CustomersTab />;
      case 'reservations': return <ReservationsTab />;
      case 'restaurant': return <RestaurantTab />;
      case 'bar': return <BarTab />;
      case 'payments': return <PaymentsTab />;
      case 'expenses': return <ExpensesTab />;
      case 'accounts': return <AccountsTab />;
      case 'reports': return <ReportsTab />;
      case 'staff': return role === 'owner' ? <StaffTab /> : <DashboardTab />;
      case 'settings': return role === 'owner' ? <SettingsTab /> : <DashboardTab />;
      default: return <div className="placeholder-content glass-panel flex-center"><h2>Under Construction</h2></div>;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar hide-print ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo"><BedDouble size={28} className="brand-icon" /></div>
          <h1 className="brand-name">{settings.resortName}</h1>
        </div>

        <nav className="sidebar-nav">
          {(role === 'owner' || role === 'reception') && (
            <div className="nav-group">
              <span className="nav-label">Reception</span>
              <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabClick('dashboard')}>
                <LayoutDashboard size={20} /><span>Dashboard</span>
              </button>
              <button className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => handleTabClick('customers')}>
                <Users size={20} /><span>Customers</span>
              </button>
              <button className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => handleTabClick('reservations')}>
                <CalendarCheck size={20} /><span>Reservations</span>
              </button>
            </div>
          )}

          {(role === 'owner' || role === 'restaurant' || role === 'reception') && (
            <div className="nav-group">
              <span className="nav-label">Operations</span>
              <button className={`nav-item ${activeTab === 'restaurant' ? 'active' : ''}`} onClick={() => handleTabClick('restaurant')}>
                <UtensilsCrossed size={20} /><span>Restaurant</span>
              </button>
              <button className={`nav-item ${activeTab === 'bar' ? 'active' : ''}`} onClick={() => handleTabClick('bar')}>
                <Beer size={20} /><span>Bar & Inventory</span>
              </button>
            </div>
          )}

          {(role === 'owner' || role === 'reception') && (
            <div className="nav-group">
              <span className="nav-label">Finance</span>
              <button className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => handleTabClick('payments')}>
                <Wallet size={20} /><span>Payments</span>
              </button>
              <button className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => handleTabClick('expenses')}>
                <Receipt size={20} /><span>Expenses</span>
              </button>
              <button className={`nav-item ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => handleTabClick('accounts')}>
                <Landmark size={20} /><span>Accounts</span>
              </button>
              {role === 'owner' && (
                <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => handleTabClick('reports')}>
                  <FileText size={20} /><span>Reports</span>
                </button>
              )}
            </div>
          )}

          {role === 'owner' && (
            <div className="nav-group">
              <span className="nav-label">Admin</span>
              <button className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => handleTabClick('staff')}>
                <UsersRound size={20} /><span>Staff & Payroll</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          {role === 'owner' && (
            <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabClick('settings')}>
              <Settings size={20} /><span>Settings</span>
            </button>
          )}
          <div className="user-profile">
            <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name" style={{ textTransform: 'capitalize' }}>{userName}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>{role}</span>
            </div>
            <LogOut size={16} className="logout-icon" onClick={() => { logout(); setSidebarOpen(false); }} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar hide-print">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={24} /></button>
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="topbar-right">
            {supabaseConfigured ? (
              <div className={`cloud-status-badge ${supabaseLoading ? 'syncing' : 'active'}`} title={supabaseLoading ? "Syncing data with cloud..." : "Cloud database connected"}>
                <Cloud size={16} className="cloud-icon" />
                <span className="dot"></span>
                <span className="label">{supabaseLoading ? "Syncing..." : "Cloud Active"}</span>
              </div>
            ) : (
              <div className="cloud-status-badge local" title="Running in local-only mode (data stored in browser)">
                <CloudOff size={16} className="cloud-icon" />
                <span className="dot"></span>
                <span className="label">Local DB</span>
              </div>
            )}
            <button className="notification-btn">
              <Bell size={20} />{alertCount > 0 && <span className="notification-badge">{alertCount}</span>}
            </button>
            <div className="clock">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </header>
        <div className="content-area">{renderContent()}</div>
      </main>
    </div>
  );
}

export default App;
