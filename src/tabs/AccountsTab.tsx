import { useState } from 'react';
import { useStore } from '../store';

export default function AccountsTab() {
  const { payments, expenses, bankDeposits, addBankDeposit } = useStore();

  const [depositForm, setDepositForm] = useState({
    amount: '', bankName: '', accountNumber: '', depositSlipRef: '', date: new Date().toISOString().slice(0, 10), notes: '',
  });

  // ── Cash Account Calculation ──
  const cashIn = payments.filter(p => !p.reversed && p.mode === 'Cash').reduce((s, p) => s + p.amount, 0);
  const cashExpenses = expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0);
  const cashDeposited = bankDeposits.reduce((s, d) => s + d.amount, 0);
  const cashInHand = cashIn - cashExpenses - cashDeposited;

  // ── Bank Account Calculation ──
  const digitalIn = payments.filter(p => !p.reversed && ['UPI', 'Card', 'Net Banking'].includes(p.mode)).reduce((s, p) => s + p.amount, 0);
  const bankExpenses = expenses.filter(e => ['UPI', 'Card', 'Net Banking'].includes(e.paymentMode)).reduce((s, e) => s + e.amount, 0);
  const otaIn = payments.filter(p => !p.reversed && p.mode === 'OTA Collect').reduce((s, p) => s + p.amount, 0);
  const bankBalance = digitalIn + cashDeposited + otaIn - bankExpenses;

  const totalRevenue = payments.filter(p => !p.reversed && p.mode !== 'OTA Commission').reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', height: '100%', display: 'flex', gap: '2rem'}}>
      <div style={{flex: 1, minWidth: '300px'}}>
        {/* Account Summary Cards */}
        <h2 className="section-title">Account Summary</h2>

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem'}}>
          {/* Cash In Hand */}
          <div style={{padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px'}}>
            <div style={{fontSize: '0.85rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'}}>Cash In Hand</div>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#10b981'}}>₹{cashInHand.toFixed(2)}</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px'}}>
              Collected: ₹{cashIn.toFixed(2)} · Spent: ₹{cashExpenses.toFixed(2)} · Deposited: ₹{cashDeposited.toFixed(2)}
            </div>
          </div>

          {/* Bank Balance */}
          <div style={{padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px'}}>
            <div style={{fontSize: '0.85rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'}}>Bank Balance (Estimated)</div>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6'}}>₹{bankBalance.toFixed(2)}</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px'}}>
              Digital: ₹{digitalIn.toFixed(2)} · Deposits: ₹{cashDeposited.toFixed(2)} · OTA: ₹{otaIn.toFixed(2)} · Spent: ₹{bankExpenses.toFixed(2)}
            </div>
          </div>

          {/* Net Position */}
          <div style={{padding: '16px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px'}}>
            <div style={{fontSize: '0.85rem', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'}}>Net Position</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#a855f7'}}>₹{(totalRevenue - totalExpenses).toFixed(2)}</div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px'}}>
              Revenue: ₹{totalRevenue.toFixed(2)} · Expenses: ₹{totalExpenses.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Bank Deposit Form */}
        <h3 className="section-title" style={{marginTop: '2rem'}}>Deposit Cash to Bank</h3>
        <div className="glass-panel" style={{padding: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <input className="form-input" type="number" placeholder="Amount (₹)" value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})} />
          <input className="form-input" placeholder="Bank Name" value={depositForm.bankName} onChange={e => setDepositForm({...depositForm, bankName: e.target.value})} />
          <input className="form-input" placeholder="Account Number" value={depositForm.accountNumber} onChange={e => setDepositForm({...depositForm, accountNumber: e.target.value})} />
          <input className="form-input" placeholder="Deposit Slip / Ref No." value={depositForm.depositSlipRef} onChange={e => setDepositForm({...depositForm, depositSlipRef: e.target.value})} />
          <input className="form-input" type="date" value={depositForm.date} onChange={e => setDepositForm({...depositForm, date: e.target.value})} />
          <input className="form-input" placeholder="Notes (optional)" value={depositForm.notes} onChange={e => setDepositForm({...depositForm, notes: e.target.value})} />
          <button className="btn-primary" onClick={() => {
            if (!depositForm.amount || !depositForm.bankName) return;
            addBankDeposit(Number(depositForm.amount), depositForm.bankName, depositForm.accountNumber, depositForm.depositSlipRef, depositForm.date, depositForm.notes);
            setDepositForm({ amount: '', bankName: depositForm.bankName, accountNumber: depositForm.accountNumber, depositSlipRef: '', date: new Date().toISOString().slice(0, 10), notes: '' });
          }}>Record Deposit</button>
        </div>
      </div>

      <div style={{flex: 2, overflowY: 'auto'}}>
        <h2>Bank Deposit History</h2>
        <table className="data-table" style={{marginTop: '1rem'}}>
          <thead>
            <tr><th>Date</th><th>Bank</th><th>Account</th><th>Slip/Ref</th><th>Notes</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {bankDeposits.map(d => (
              <tr key={d.id}>
                <td>{d.date}</td>
                <td>{d.bankName}</td>
                <td>{d.accountNumber || '—'}</td>
                <td>{d.depositSlipRef || '—'}</td>
                <td>{d.notes || '—'}</td>
                <td style={{fontWeight: 'bold', color: 'var(--status-green)'}}>₹{d.amount.toFixed(2)}</td>
              </tr>
            ))}
            {bankDeposits.length === 0 && (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>No deposits recorded yet.</td></tr>
            )}
          </tbody>
        </table>

        {/* Cash Flow Summary */}
        <h2 style={{marginTop: '2rem'}}>Cash Flow Breakdown</h2>
        <table className="data-table" style={{marginTop: '1rem'}}>
          <thead>
            <tr><th>Description</th><th style={{textAlign: 'right'}}>Inflow</th><th style={{textAlign: 'right'}}>Outflow</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Cash Collections (Guests)</td>
              <td style={{textAlign: 'right', color: 'var(--status-green)'}}>₹{cashIn.toFixed(2)}</td>
              <td style={{textAlign: 'right'}}>—</td>
            </tr>
            <tr>
              <td>UPI / Card / Net Banking Collections</td>
              <td style={{textAlign: 'right', color: 'var(--status-green)'}}>₹{digitalIn.toFixed(2)}</td>
              <td style={{textAlign: 'right'}}>—</td>
            </tr>
            <tr>
              <td>OTA Collected (Pending Settlement)</td>
              <td style={{textAlign: 'right', color: 'var(--status-blue)'}}>₹{otaIn.toFixed(2)}</td>
              <td style={{textAlign: 'right'}}>—</td>
            </tr>
            <tr>
              <td>Cash Expenses</td>
              <td style={{textAlign: 'right'}}>—</td>
              <td style={{textAlign: 'right', color: 'var(--status-red)'}}>₹{cashExpenses.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Bank/Digital Expenses</td>
              <td style={{textAlign: 'right'}}>—</td>
              <td style={{textAlign: 'right', color: 'var(--status-red)'}}>₹{bankExpenses.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Cash Deposited to Bank</td>
              <td style={{textAlign: 'right'}}>—</td>
              <td style={{textAlign: 'right', color: 'var(--status-yellow)'}}>₹{cashDeposited.toFixed(2)}</td>
            </tr>
            <tr style={{borderTop: '2px solid rgba(255,255,255,0.1)'}}>
              <td style={{fontWeight: 'bold'}}>Net Cash in Hand</td>
              <td colSpan={2} style={{textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: cashInHand >= 0 ? 'var(--status-green)' : 'var(--status-red)'}}>₹{cashInHand.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
