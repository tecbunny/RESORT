import { useState } from 'react';
import { useStore } from '../store';
import type { PaymentMode } from '../types';

export default function PaymentsTab() {
  const { payments, rooms, bookings, otaSettlements, settings, collectPaymentForRoom, reversePayment, recordOtaSettlement, role } = useStore();
  const [roomId, setRoomId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [ref, setRef] = useState('');

  // OTA Settlement form
  const [otaForm, setOtaForm] = useState({ otaName: '', grossAmount: '', commissionDeducted: '', netReceived: '', transactionRef: '', bankDate: '', notes: '' });
  const [activeSection, setActiveSection] = useState<'collect' | 'ota'>('collect');

  // Auto-calculate net when gross/commission change
  const handleOtaGrossChange = (val: string) => {
    const gross = Number(val) || 0;
    const comm = Number(otaForm.commissionDeducted) || 0;
    setOtaForm({ ...otaForm, grossAmount: val, netReceived: String(gross - comm) });
  };
  const handleOtaCommChange = (val: string) => {
    const gross = Number(otaForm.grossAmount) || 0;
    const comm = Number(val) || 0;
    setOtaForm({ ...otaForm, commissionDeducted: val, netReceived: String(gross - comm) });
  };

  // Get unsettled OTA bookings for reference
  const settledBookingIds = otaSettlements.flatMap(s => s.bookingIds);
  const unsettledOtaBookings = bookings.filter(b => b.source === 'OTA' && (b.status === 'settled' || b.status === 'active') && !settledBookingIds.includes(b.id));

  return (
    <div className="glass-panel animate-fade-in payments-tab-container" style={{padding: '1.5rem', height: '100%', overflowY: 'auto'}}>
      <div className="payments-tab-form-column" style={{flex: 1}}>
        {/* Tab toggle */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '1.5rem'}}>
          <button className={activeSection === 'collect' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveSection('collect')}>Collect Payment</button>
          <button className={activeSection === 'ota' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveSection('ota')}>OTA Settlement</button>
        </div>

        {activeSection === 'collect' && (
          <div className="glass-panel" style={{padding:'1rem', display:'flex', flexDirection:'column', gap:'10px'}}>
            <h3>Collect from Guest</h3>
            <select className="form-input" value={roomId} onChange={e=>setRoomId(e.target.value)}>
               <option value="">Select Room</option>
               {rooms.filter(r => r.status === 'red' || r.status === 'pink').map(r => (
                 <option key={r.id} value={r.id}>Room {r.number} - Bill: ₹{r.bill}</option>
               ))}
            </select>
            <input type="number" placeholder="Amount" className="form-input" value={amount} onChange={e=>setAmount(e.target.value)}/>
            <select className="form-input" value={mode} onChange={e=>setMode(e.target.value as PaymentMode)}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Net Banking</option>
              <option>Owner Adjustment</option>
            </select>
            <input placeholder="Transaction reference" className="form-input" value={ref} onChange={e=>setRef(e.target.value)}/>
            <button className="btn-primary" onClick={() => { collectPaymentForRoom(roomId, Number(amount), mode, ref || 'N/A'); setAmount(''); setRoomId(''); setRef('');}}>Collect Payment</button>
          </div>
        )}

        {activeSection === 'ota' && (
          <div className="glass-panel" style={{padding:'1rem', display:'flex', flexDirection:'column', gap:'10px'}}>
            <h3>Record OTA Settlement</h3>
            <p className="section-subtitle" style={{margin:0}}>Enter details when an aggregator transfers funds to your bank account.</p>
            <select className="form-input" value={otaForm.otaName} onChange={e => setOtaForm({...otaForm, otaName: e.target.value})}>
              <option value="">Select Aggregator</option>
              {(settings.aggregators || []).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
            </select>
            <input type="number" placeholder="Gross Amount (Total Booking Value)" className="form-input" value={otaForm.grossAmount} onChange={e => handleOtaGrossChange(e.target.value)} />
            <input type="number" placeholder="Commission Deducted by OTA" className="form-input" value={otaForm.commissionDeducted} onChange={e => handleOtaCommChange(e.target.value)} />
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
              <span style={{color: 'var(--text-secondary)', whiteSpace: 'nowrap'}}>Net Received:</span>
              <span style={{fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--status-green)'}}>₹{otaForm.netReceived || '0'}</span>
            </div>
            <input placeholder="Bank Transaction / UTR Reference" className="form-input" value={otaForm.transactionRef} onChange={e => setOtaForm({...otaForm, transactionRef: e.target.value})} />
            <input type="date" className="form-input" value={otaForm.bankDate} onChange={e => setOtaForm({...otaForm, bankDate: e.target.value})} />
            <textarea className="form-input" placeholder="Notes (optional)" rows={2} value={otaForm.notes} onChange={e => setOtaForm({...otaForm, notes: e.target.value})} style={{resize: 'vertical'}} />
            
            {unsettledOtaBookings.length > 0 && (
              <div style={{padding: '8px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px'}}>
                <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>Pending OTA Bookings ({otaForm.otaName ? unsettledOtaBookings.filter(b => b.otaName === otaForm.otaName).length : unsettledOtaBookings.length}):</span>
                <div style={{marginTop: '4px', maxHeight: '100px', overflowY: 'auto'}}>
                  {(otaForm.otaName ? unsettledOtaBookings.filter(b => b.otaName === otaForm.otaName) : unsettledOtaBookings).map(b => (
                    <div key={b.id} style={{fontSize: '0.8rem', padding: '2px 0', color: 'var(--text-secondary)'}}>
                      {b.id} · Room {b.roomNumber} · {b.customerName} · ₹{b.tariff}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" onClick={() => {
              const matchedBookingIds = (otaForm.otaName
                ? unsettledOtaBookings.filter(b => b.otaName === otaForm.otaName)
                : unsettledOtaBookings
              ).map(b => b.id);
              recordOtaSettlement(
                otaForm.otaName, Number(otaForm.grossAmount), Number(otaForm.commissionDeducted),
                Number(otaForm.netReceived), otaForm.transactionRef, otaForm.bankDate,
                matchedBookingIds, otaForm.notes
              );
              setOtaForm({ otaName: '', grossAmount: '', commissionDeducted: '', netReceived: '', transactionRef: '', bankDate: '', notes: '' });
            }}>Record Settlement</button>
          </div>
        )}
      </div>
      <div className="payments-tab-history-column" style={{flex: 2}}>
        <h2>Payment History</h2>
        <div className="table-responsive">
          <table className="data-table" style={{marginTop:'1rem'}}>
          <thead>
            <tr><th>ID</th><th>Amount</th><th>Mode</th><th>Collected By</th><th>Status</th></tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>₹{p.amount}</td>
                <td>{p.mode}</td>
                <td>{p.collectedBy}</td>
                <td>
                  {p.reversed ? <span className="status-badge inactive">Reversed</span> : <span className="status-badge active">Success</span>}
                  {!p.reversed && role === 'owner' && <button className="btn-text text-red" style={{marginLeft:'10px'}} onClick={() => reversePayment(p.id, 'Owner override')}>Reverse</button>}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        
        {otaSettlements.length > 0 && (
          <>
            <h2 style={{marginTop: '2rem'}}>OTA Settlement History</h2>
            <div className="table-responsive">
              <table className="data-table" style={{marginTop:'1rem'}}>
              <thead>
                <tr><th>ID</th><th>OTA</th><th>Gross</th><th>Commission</th><th>Net Received</th><th>Bank Date</th><th>UTR/Ref</th></tr>
              </thead>
              <tbody>
                {otaSettlements.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td><span style={{color: 'var(--status-blue)'}}>{s.otaName}</span></td>
                    <td>₹{s.grossAmount}</td>
                    <td style={{color: 'var(--status-red)'}}>-₹{s.commissionDeducted}</td>
                    <td style={{color: 'var(--status-green)', fontWeight: 'bold'}}>₹{s.netReceived}</td>
                    <td>{s.bankDate}</td>
                    <td>{s.transactionRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  </div>
);
}
