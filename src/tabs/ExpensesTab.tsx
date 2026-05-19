import { useState } from 'react';
import { useStore } from '../store';
import type { ExpenseCategory, PaymentMode } from '../types';

const CATEGORIES: ExpenseCategory[] = ['Restaurant', 'Resort Maintenance', 'Petty Cash', 'Inventory / Stock Purchase'];

export default function ExpensesTab() {
  const { expenses, inventory, addExpense } = useStore();
  const [form, setForm] = useState({
    category: 'Restaurant' as ExpenseCategory,
    description: '',
    amount: '',
    paidTo: '',
    paymentMode: 'Cash' as PaymentMode,
    receiptRef: '',
    date: new Date().toISOString().slice(0, 10),
    inventoryItemId: '',
    stockQty: '',
  });
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'All'>('All');

  const filtered = filterCategory === 'All' ? expenses : expenses.filter(e => e.category === filterCategory);

  const totalByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', minHeight: '100%', display:'flex', flexWrap: 'wrap', gap:'2rem'}}>
      <div style={{flex: 1, minWidth: '300px'}}>
        <h2 className="section-title">Record Expense</h2>
        <p className="section-subtitle">Log outflows for restaurant purchases, resort maintenance, petty cash, and inventory stock.</p>

        <div className="glass-panel" style={{padding:'1rem', marginTop:'1rem', display:'flex', flexDirection:'column', gap:'10px'}}>
          <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value as ExpenseCategory, inventoryItemId: '', stockQty: ''})}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {form.category === 'Inventory / Stock Purchase' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px'}}>
              <select className="form-input" value={form.inventoryItemId} onChange={e => {
                const item = inventory.find(i => i.id === e.target.value);
                setForm({...form, inventoryItemId: e.target.value, description: item ? `Stock Purchase: ${item.name}` : form.description});
              }}>
                <option value="">Select Inventory Item (optional)</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>{item.name} — Stock: {item.currentStock} {item.unit}</option>
                ))}
              </select>
              {form.inventoryItemId && (
                <input className="form-input" type="number" placeholder="Qty Purchased" value={form.stockQty} onChange={e => setForm({...form, stockQty: e.target.value})} />
              )}
            </div>
          )}

          <input className="form-input" placeholder="Description (e.g. Vegetable Purchase)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <input className="form-input" type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <input className="form-input" placeholder="Paid To (Vendor / Person)" value={form.paidTo} onChange={e => setForm({...form, paidTo: e.target.value})} />

          <select className="form-input" value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value as PaymentMode})}>
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Net Banking</option>
          </select>

          <input className="form-input" placeholder="Receipt / Bill No. (optional)" value={form.receiptRef} onChange={e => setForm({...form, receiptRef: e.target.value})} />
          <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />

          <button className="btn-primary" onClick={() => {
            if (!form.description.trim() || !form.amount) return;
            addExpense(
              form.category, form.description, Number(form.amount), form.paidTo,
              form.paymentMode, form.receiptRef, form.date,
              form.inventoryItemId || undefined, Number(form.stockQty) || undefined
            );
            setForm({ ...form, description: '', amount: '', paidTo: '', receiptRef: '', inventoryItemId: '', stockQty: '' });
          }}>Add Expense</button>
        </div>

        {/* Summary Cards */}
        <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {CATEGORIES.map(cat => (
            <div key={cat} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
              <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{cat}</span>
              <span style={{fontWeight: 'bold', color: 'var(--status-red)'}}>₹{totalByCategory[cat].toFixed(2)}</span>
            </div>
          ))}
          <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderTop: '2px solid rgba(255,255,255,0.1)'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>Total Expenses</span>
            <span style={{fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--status-red)'}}>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{flex: 2, minWidth: '320px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>Expense Ledger</h2>
          <select className="form-input" style={{width: 'auto'}} value={filterCategory} onChange={e => setFilterCategory(e.target.value as ExpenseCategory | 'All')}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="table-responsive">
          <table className="data-table" style={{marginTop:'1rem'}}>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Description</th><th>Paid To</th><th>Mode</th><th>Receipt</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem',
                    background: e.category === 'Restaurant' ? 'rgba(245,158,11,0.2)' :
                                e.category === 'Resort Maintenance' ? 'rgba(59,130,246,0.2)' :
                                e.category === 'Inventory / Stock Purchase' ? 'rgba(168,85,247,0.2)' :
                                'rgba(16,185,129,0.2)',
                    color: e.category === 'Restaurant' ? '#f59e0b' :
                           e.category === 'Resort Maintenance' ? '#3b82f6' :
                           e.category === 'Inventory / Stock Purchase' ? '#a855f7' :
                           '#10b981',
                  }}>{e.category}</span>
                </td>
                <td>
                  {e.description}
                  {e.stockQty && <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '6px'}}>({e.stockQty} units)</span>}
                </td>
                <td>{e.paidTo || '—'}</td>
                <td>{e.paymentMode}</td>
                <td>{e.receiptRef || '—'}</td>
                <td style={{fontWeight: 'bold', color: 'var(--status-red)'}}>₹{e.amount.toFixed(2)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>No expense entries yet.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
