import { useState, Fragment } from 'react';
import { BedDouble, X } from 'lucide-react';
import { useStore } from '../store';
import type { Room, RoomStatus, PaymentMode } from '../types';
import { generateBillingSummary } from '../lib/billing';

const ROOM_STATUSES: { id: RoomStatus; label: string; color: string }[] = [
  { id: 'green', label: 'Vacant & Clean', color: 'var(--status-green)' },
  { id: 'blue', label: 'Reserved Today', color: 'var(--status-blue)' },
  { id: 'red', label: 'Occupied & Clean', color: 'var(--status-red)' },
  { id: 'pink', label: 'Occupied & Dirty', color: 'var(--status-pink)' },
  { id: 'yellow', label: 'Vacant & Dirty', color: 'var(--status-yellow)' },
  { id: 'grey', label: 'Maintenance', color: 'var(--status-grey)' },
];

export default function DashboardTab() {
  const { rooms, bookings, orders, serviceCharges, customers, settings, payments, checkInRoom, completeCheckout, requestCleaning, completeCleaning, addServiceCharge, collectPaymentForRoom, extendStay } = useStore();
  
  const [modalType, setModalType] = useState<'checkin' | 'checkout' | 'invoice' | 'menu' | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkInForm, setCheckInForm] = useState({ name: '', mobile: '', idType: 'Aadhaar', idNumber: '', documentName: '' });
  const [chargeForm, setChargeForm] = useState({ description: '', amount: '' });
  const [extendForm, setExtendForm] = useState({ active: false, newDate: '' });
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState<PaymentMode>('Cash');
  const [invoiceMeta, setInvoiceMeta] = useState<{ number: string; date: string; bookingId: string | null } | null>(null);

  const counts: Record<RoomStatus, number> = {
    green: rooms.filter(r => r.status === 'green').length,
    blue: rooms.filter(r => r.status === 'blue').length,
    red: rooms.filter(r => r.status === 'red').length,
    pink: rooms.filter(r => r.status === 'pink').length,
    yellow: rooms.filter(r => r.status === 'yellow').length,
    grey: rooms.filter(r => r.status === 'grey').length,
  };

  const handleRoomClick = (r: Room) => {
    setSelectedRoom(r);
    setExtendForm({ active: false, newDate: '' });
    if (r.status === 'green' || r.status === 'blue') {
      setCheckInForm({ name: r.guest || '', mobile: r.guestMobile || '', idType: 'Aadhaar', idNumber: '', documentName: '' });
      setModalType('checkin');
    }
    else if (r.status === 'red' || r.status === 'pink') setModalType('menu');
    else if (r.status === 'yellow') {
      completeCleaning(r.id);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header"><span className="stat-title">Available Rooms</span><div className="stat-icon-wrapper green"><BedDouble size={20}/></div></div>
          <h3 className="stat-value">{counts.green}</h3>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-header"><span className="stat-title">Occupied Rooms</span><div className="stat-icon-wrapper blue"><BedDouble size={20}/></div></div>
          <h3 className="stat-value">{counts.red + counts.pink}</h3>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-header"><span className="stat-title">Cleaning Required</span><div className="stat-icon-wrapper yellow"><BedDouble size={20}/></div></div>
          <h3 className="stat-value">{counts.yellow + counts.pink}</h3>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-header"><span className="stat-title">Maintenance</span><div className="stat-icon-wrapper" style={{color:'grey'}}><BedDouble size={20}/></div></div>
          <h3 className="stat-value">{counts.grey}</h3>
        </div>
      </div>

      <div className="matrix-section glass-panel">
        <div className="matrix-header flex-between">
          <div><h2 className="section-title">Master Room Matrix</h2></div>
        </div>
        <div className="legend-row">
          {ROOM_STATUSES.map(s => (
            <div key={s.id} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: s.color }}></span>
              <span className="legend-label">{s.label}</span>
              <span className="legend-count">{counts[s.id]}</span>
            </div>
          ))}
        </div>
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.id} className={`room-card status-${room.status}`} onClick={() => handleRoomClick(room)}>
              <div className="room-card-header">
                <span className="room-number">{room.number}</span><span className="room-category">{room.category}</span>
              </div>
              <div className="room-card-body">
                {room.guest ? <span className="guest-name">{room.guest}</span> : <span className="guest-empty">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalType === 'checkin' && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header"><h3>Check-In: {selectedRoom.number}</h3><button onClick={()=>setModalType(null)} className="close-btn"><X/></button></div>
            <form onSubmit={e => { e.preventDefault(); checkInRoom(selectedRoom.id, checkInForm.name, checkInForm.mobile, checkInForm.idType, checkInForm.idNumber, checkInForm.documentName); setModalType(null); }} className="modal-body">
              <input required placeholder="Customer name" className="form-input" value={checkInForm.name} onChange={e => setCheckInForm({...checkInForm, name: e.target.value})} />
              <input required placeholder="Mobile number" className="form-input" value={checkInForm.mobile} onChange={e => setCheckInForm({...checkInForm, mobile: e.target.value})} />
              <select className="form-input" value={checkInForm.idType} onChange={e => setCheckInForm({...checkInForm, idType: e.target.value})}>
                <option>Aadhaar</option>
                <option>EPIC / Election Card</option>
                <option>Driving License</option>
                <option>Passport</option>
                <option>Other</option>
              </select>
              <input required placeholder="Document ID number" className="form-input" value={checkInForm.idNumber} onChange={e => setCheckInForm({...checkInForm, idNumber: e.target.value})} />
              <input className="form-input" type="file" accept="image/*,.pdf" onChange={e => setCheckInForm({...checkInForm, documentName: e.target.files?.[0]?.name || ''})} />
              {checkInForm.documentName && <p className="section-subtitle">Attached: {checkInForm.documentName}</p>}
              <button className="btn-primary">Confirm Check-in</button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'menu' && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header"><h3>Room {selectedRoom.number} Actions</h3><button onClick={()=>setModalType(null)} className="close-btn"><X/></button></div>
            <div className="modal-body flex-col gap-sm" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <button className="btn-primary" onClick={() => setModalType('checkout')}>Proceed to Checkout</button>
              <button className="btn-secondary" onClick={() => setExtendForm({ active: true, newDate: '' })}>Extend Stay</button>
              {extendForm.active && (
                <div style={{display: 'flex', gap: '10px', marginTop: '5px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                  <input type="date" className="form-input" value={extendForm.newDate} onChange={e => setExtendForm({ ...extendForm, newDate: e.target.value })} style={{flex: 1}} />
                  <button className="btn-primary" onClick={() => {
                    if (extendForm.newDate) extendStay(selectedRoom.id, extendForm.newDate);
                    setExtendForm({ active: false, newDate: '' });
                    setModalType(null);
                  }}>Save</button>
                </div>
              )}
              {selectedRoom.status === 'red' && <button className="btn-secondary" onClick={() => { requestCleaning(selectedRoom.id); setModalType(null); }}>Request Cleaning</button>}
              {selectedRoom.status === 'pink' && <button className="btn-secondary" onClick={() => { completeCleaning(selectedRoom.id); setModalType(null); }}>Mark Cleaned</button>}
            </div>
          </div>
        </div>
      )}

      {modalType === 'checkout' && selectedRoom && (() => {
        const booking = bookings.find(b => b.id === selectedRoom.bookingId) || bookings.find(b => b.roomId === selectedRoom.id && (b.status === 'settled' || b.status === 'active'));
        const summary = generateBillingSummary(selectedRoom, booking, orders, serviceCharges, payments);

        return (
          <div className="modal-overlay">
            <div className="modal-content glass-panel">
              <div className="modal-header"><h3>Checkout {selectedRoom.number}</h3><button onClick={()=>setModalType(null)} className="close-btn"><X/></button></div>
              <div className="modal-body">
                <div style={{marginBottom: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                      <span style={{color: 'var(--text-secondary)'}}>Part A (Room + GST):</span>
                      <span>₹{summary.grandTotalRoom.toFixed(2)}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px'}}>
                      <span style={{color: 'var(--text-secondary)'}}>Part B (F&B + GST):</span>
                      <span>₹{summary.grandTotalFnB.toFixed(2)}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                      <span>Gross Total:</span>
                      <span>₹{summary.grossTotal.toFixed(2)}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--status-green)'}}>
                      <span>Payments Applied:</span>
                      <span>- ₹{summary.totalPaid.toFixed(2)}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                      <span style={{fontWeight: 'bold', fontSize: '1.2rem', color: summary.balanceDue > 0 ? 'var(--status-red)' : 'var(--status-green)'}}>Net Balance Due:</span>
                      <span style={{fontWeight: 'bold', fontSize: '1.2rem', color: summary.balanceDue > 0 ? 'var(--status-red)' : 'var(--status-green)'}}>₹{summary.balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                <div className="billing-summary" style={{display:'flex', flexDirection:'column', gap:'0.75rem', margin:'1.5rem 0', padding:'1rem', background:'rgba(15, 23, 42, 0.4)', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.05)'}}>
                <strong style={{color:'var(--text-secondary)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.5px'}}>Housekeeping audit / extra charge</strong>
                <input placeholder="Damage or service description" className="form-input" value={chargeForm.description} onChange={e => setChargeForm({...chargeForm, description: e.target.value})} />
                <input type="number" placeholder="Amount (₹)" className="form-input" value={chargeForm.amount} onChange={e => setChargeForm({...chargeForm, amount: e.target.value})} />
                <button className="btn-secondary" style={{alignSelf: 'flex-start'}} onClick={() => { const amount = Number(chargeForm.amount); addServiceCharge(selectedRoom.id, chargeForm.description, amount); setChargeForm({ description: '', amount: '' }); }}>Add Charge</button>
              </div>
              
              {summary.balanceDue > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Settle Balance (₹{summary.balanceDue.toFixed(2)})</label>
                  <select className="form-input" value={checkoutPaymentMode} onChange={e => setCheckoutPaymentMode(e.target.value as PaymentMode)}>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="OTA Collect">OTA Collect</option>
                    <option value="OTA Commission">OTA Commission Adjustment</option>
                  </select>
                </div>
              )}
              
              <button className="btn-primary" style={{width: '100%'}} onClick={() => { 
                if (summary.balanceDue > 0) {
                  collectPaymentForRoom(selectedRoom.id, summary.balanceDue, checkoutPaymentMode, 'Checkout Settlement');
                }
                setInvoiceMeta({ number: `INV-${selectedRoom.bookingId || selectedRoom.id}-${Date.now().toString().slice(-6)}`, date: new Date().toLocaleDateString(), bookingId: selectedRoom.bookingId }); 
                completeCheckout(selectedRoom.id); 
                setModalType('invoice'); 
              }}>
                {summary.balanceDue > 0 ? `Settle ₹${summary.balanceDue.toFixed(2)} & Checkout` : 'Complete Checkout & View Invoice'}
              </button>
            </div>
          </div>
        </div>
      )})()}

      {modalType === 'invoice' && selectedRoom && (() => {
        const bookingId = invoiceMeta?.bookingId || selectedRoom.bookingId;
        const booking = bookings.find(b => b.id === bookingId) || bookings.find(b => b.roomId === selectedRoom.id && (b.status === 'settled' || b.status === 'active'));
        const customer = customers.find(c => c.id === booking?.customerId);
        
        const summary = generateBillingSummary(selectedRoom, booking, orders, serviceCharges, payments);
        const linkedOrders = orders.filter(o => o.bookingId === booking?.id && o.status !== 'cancelled');
        const linkedServices = serviceCharges.filter(c => c.bookingId === booking?.id);
        const linkedPayments = payments.filter(p => p.bookingId === booking?.id && !p.reversed);

        const ordersByDate = linkedOrders.reduce((acc, o) => {
          const date = new Date(o.createdAt).toLocaleDateString();
          if (!acc[date]) acc[date] = [];
          acc[date].push(o);
          return acc;
        }, {} as Record<string, typeof linkedOrders>);

        return (
          <div className="modal-overlay">
            <div className="modal-content glass-panel invoice-modal printable-area" style={{maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto'}}>
               <div className="modal-header hide-print">
                 <h3>Guest Folio / Tax Invoice</h3>
                 <div style={{display:'flex',gap:'10px'}}>
                   <button className="btn-primary" onClick={()=>window.print()}>Print All</button>
                   <button onClick={()=>setModalType(null)} className="close-btn"><X/></button>
                 </div>
               </div>
               
               <div className="modal-body invoice-body" style={{fontSize: '0.85rem'}}>
                  {/* Business & Guest Details */}
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem'}}>
                    <div>
                      <h2 style={{fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--text-primary)'}}>{settings.resortName}</h2>
                      <p>{settings.address}</p>
                      <p>Phone: {settings.phone} | Email: {settings.email}</p>
                      <p>Website: www.aura-resort.com</p>
                      <p><strong>GSTIN:</strong> {settings.gstin}</p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <h3 style={{fontSize: '1.2rem', marginBottom: '0.25rem'}}>Billed To:</h3>
                      <p><strong>{booking?.customerName || selectedRoom.guest || 'Walk-in Guest'}</strong></p>
                      <p>{customer?.address || 'Address not provided'}</p>
                      <p>Guests: {booking?.guests || 1} | Booking Ref: {booking?.id || 'N/A'}</p>
                    </div>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '4px'}}>
                    <div>
                      <p><strong>Room:</strong> {selectedRoom.number} ({selectedRoom.category})</p>
                      <p><strong>Rate/Night:</strong> ₹{summary.ratePerNight.toFixed(2)}</p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <p><strong>Master Invoice No:</strong> #{invoiceMeta?.number || `INV-${booking?.id || selectedRoom.id}`}</p>
                      <p><strong>Invoice Date:</strong> {invoiceMeta?.date || new Date().toLocaleDateString()}</p>
                      <p><strong>Check-In:</strong> {booking?.checkIn || 'N/A'} | <strong>Check-Out:</strong> {booking?.checkOut || new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* PART A: ACCOMMODATION & SERVICES */}
                  <h3 style={{borderBottom: '1px solid #555', paddingBottom: '8px', marginBottom: '12px'}}>PART A: ACCOMMODATION & SERVICES</h3>
                  <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '1rem'}}>
                    <thead>
                      <tr style={{textAlign: 'left', color: 'var(--text-secondary)'}}>
                        <th style={{padding: '8px 4px', borderBottom: '1px solid #444'}}>Description</th>
                        <th style={{padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #444'}}>Qty</th>
                        <th style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #444'}}>Unit Price</th>
                        <th style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #444'}}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{padding: '8px 4px', borderBottom: '1px solid #333'}}>Room Accommodation ({summary.nights} Nights)</td>
                        <td style={{padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #333'}}>{summary.nights}</td>
                        <td style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #333'}}>₹{summary.ratePerNight.toFixed(2)}</td>
                        <td style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #333'}}>₹{summary.totalRoomCharge.toFixed(2)}</td>
                      </tr>
                      {linkedServices.map(c => (
                        <tr key={c.id}>
                          <td style={{padding: '8px 4px', borderBottom: '1px solid #333'}}>{c.description}</td>
                          <td style={{padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #333'}}>1</td>
                          <td style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #333'}}>₹{c.amount.toFixed(2)}</td>
                          <td style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #333'}}>₹{c.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem'}}>
                    <table style={{width: '350px', borderCollapse: 'collapse'}}>
                      <tbody>
                        <tr>
                          <td style={{padding: '4px'}}>Subtotal (Part A):</td>
                          <td style={{padding: '4px', textAlign: 'right'}}>₹{(summary.totalRoomCharge + summary.serviceTotal).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '4px', color: 'var(--text-secondary)'}}>CGST ({summary.roomGstRate/2}%):</td>
                          <td style={{padding: '4px', textAlign: 'right', color: 'var(--text-secondary)'}}>₹{summary.roomCgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '4px', color: 'var(--text-secondary)', borderBottom: '1px solid #555'}}>SGST ({summary.roomGstRate/2}%):</td>
                          <td style={{padding: '4px', textAlign: 'right', color: 'var(--text-secondary)', borderBottom: '1px solid #555'}}>₹{summary.roomSgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '4px', fontWeight: 'bold'}}>Total Part A:</td>
                          <td style={{padding: '4px', textAlign: 'right', fontWeight: 'bold'}}>₹{summary.grandTotalRoom.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* PART B: FOOD & BEVERAGE */}
                  <h3 style={{borderBottom: '1px solid #555', paddingBottom: '8px', marginBottom: '12px', marginTop: '2rem'}}>PART B: FOOD & BEVERAGE</h3>
                  <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '1rem'}}>
                    <thead>
                      <tr style={{textAlign: 'left', color: 'var(--text-secondary)'}}>
                        <th style={{padding: '8px 4px', borderBottom: '1px solid #444'}}>Item Description</th>
                        <th style={{padding: '8px 4px', borderBottom: '1px solid #444'}}>Outlet</th>
                        <th style={{padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #444'}}>Qty</th>
                        <th style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #444'}}>Unit Price</th>
                        <th style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #444'}}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedOrders.length === 0 ? (
                        <tr><td colSpan={5} style={{padding: '8px 4px', textAlign: 'center', fontStyle: 'italic', color: '#666'}}>No F&B charges</td></tr>
                      ) : (
                        Object.entries(ordersByDate).map(([date, dateOrders]) => (
                          <Fragment key={date}>
                            <tr>
                              <td colSpan={5} style={{padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.08)', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                Date: {date}
                              </td>
                            </tr>
                            {dateOrders.map(o => o.items.map((item, idx) => (
                              <tr key={`ord-${o.id}-${idx}`}>
                                <td style={{padding: '8px 4px', borderBottom: '1px solid #333'}}>{item.name}</td>
                                <td style={{padding: '8px 4px', borderBottom: '1px solid #333', textTransform: 'capitalize'}}>{o.type}</td>
                                <td style={{padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #333'}}>{item.qty}</td>
                                <td style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #333'}}>₹{item.rate.toFixed(2)}</td>
                                <td style={{padding: '8px 4px', textAlign: 'right', borderBottom: '1px solid #333'}}>₹{(item.qty * item.rate).toFixed(2)}</td>
                              </tr>
                            )))}
                          </Fragment>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem'}}>
                    <table style={{width: '350px', borderCollapse: 'collapse'}}>
                      <tbody>
                        <tr>
                          <td style={{padding: '4px'}}>Subtotal (Part B):</td>
                          <td style={{padding: '4px', textAlign: 'right'}}>₹{(summary.restaurantBase + summary.barTotal).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '4px', color: 'var(--text-secondary)'}}>CGST (Rest. {summary.restGstRate/2}%):</td>
                          <td style={{padding: '4px', textAlign: 'right', color: 'var(--text-secondary)'}}>₹{summary.restCgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '4px', color: 'var(--text-secondary)', borderBottom: '1px solid #555'}}>SGST (Rest. {summary.restGstRate/2}%):</td>
                          <td style={{padding: '4px', textAlign: 'right', color: 'var(--text-secondary)', borderBottom: '1px solid #555'}}>₹{summary.restSgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{padding: '4px', fontWeight: 'bold'}}>Total Part B:</td>
                          <td style={{padding: '4px', textAlign: 'right', fontWeight: 'bold'}}>₹{summary.grandTotalFnB.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* CONSOLIDATED SUMMARY & PAYMENTS */}
                  <div style={{marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #eee'}}>
                    <h3 style={{marginBottom: '1rem'}}>CONSOLIDATED ACCOUNT SUMMARY</h3>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      
                      <div style={{flex: '1', paddingRight: '2rem'}}>
                        <h4 style={{marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Payments & Credits</h4>
                        {linkedPayments.length === 0 ? (
                          <p style={{fontStyle: 'italic', color: '#666'}}>No payments applied.</p>
                        ) : (
                          <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <tbody>
                              {linkedPayments.map(p => (
                                <tr key={p.id}>
                                  <td style={{padding: '4px 0', color: 'var(--status-green)'}}>{new Date(p.createdAt).toLocaleDateString()} - {p.mode}</td>
                                  <td style={{padding: '4px 0', textAlign: 'right', color: 'var(--status-green)'}}>- ₹{p.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div style={{flex: '1'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '4px'}}>
                          <tbody>
                            <tr>
                              <td style={{padding: '8px', fontSize: '1.1rem'}}>Total Part A (Accommodation):</td>
                              <td style={{padding: '8px', textAlign: 'right', fontSize: '1.1rem'}}>₹{summary.grandTotalRoom.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{padding: '8px', fontSize: '1.1rem'}}>Total Part B (F&B):</td>
                              <td style={{padding: '8px', textAlign: 'right', fontSize: '1.1rem'}}>₹{summary.grandTotalFnB.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{padding: '8px', fontWeight: 'bold', fontSize: '1.2rem', borderTop: '1px solid #555'}}>Gross Total:</td>
                              <td style={{padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', borderTop: '1px solid #555'}}>₹{summary.grossTotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{padding: '8px', color: 'var(--status-green)'}}>Less Total Payments:</td>
                              <td style={{padding: '8px', textAlign: 'right', color: 'var(--status-green)'}}>- ₹{summary.totalPaid.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style={{padding: '12px 8px', fontWeight: 'bold', fontSize: '1.4rem', borderTop: '2px solid #555', color: summary.balanceDue > 0 ? 'var(--status-red)' : 'var(--status-green)'}}>Net Balance Due:</td>
                              <td style={{padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.4rem', borderTop: '2px solid #555', color: summary.balanceDue > 0 ? 'var(--status-red)' : 'var(--status-green)'}}>₹{summary.balanceDue.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="invoice-footer" style={{textAlign: 'center', color: '#888', borderTop: '1px solid #333', marginTop: '3rem', paddingTop: '1rem'}}>
                    <p>Thank you for choosing {settings.resortName}. We hope to welcome you back soon!</p>
                    <p style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>This is a computer-generated tax invoice and guest folio.</p>
                  </div>
               </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
