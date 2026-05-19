import { useState } from 'react';
import { useStore } from '../store';

export default function ReservationsTab() {
  const { rooms, bookings, settings, createReservation, checkInRoom, cancelReservation } = useStore();
  const reservableRooms = rooms.filter(room => room.status === 'green' || room.status === 'blue');
  const reservations = bookings.filter(booking => booking.status === 'reserved');
  const [form, setForm] = useState({ name: '', mobile: '', roomId: '', checkIn: '', checkOut: '', advance: '', source: 'Direct' as 'Direct' | 'OTA', otaName: '', otaReference: '', otaCommission: '' });
  const [arrival, setArrival] = useState<{ bookingId: string; idType: string; idNumber: string; documentName: string } | null>(null);
  const arrivalBooking = arrival ? reservations.find(booking => booking.id === arrival.bookingId) : null;

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', height: '100%', display:'flex', gap:'2rem'}}>
      <div style={{flex:1}}>
        <h2 className="section-title">Reservations</h2>
        <p className="section-subtitle">Create advance bookings and convert arriving guests into checked-in stays.</p>
        <div className="glass-panel" style={{padding:'1rem', marginTop:'1rem', display:'flex', flexDirection:'column', gap:'10px'}}>
          <input className="form-input" placeholder="Guest name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="form-input" placeholder="Mobile number" value={form.mobile} onChange={e=>setForm({...form, mobile:e.target.value})}/>
          <select className="form-input" value={form.roomId} onChange={e=>setForm({...form, roomId:e.target.value})}>
            <option value="">Select clean room</option>
            {reservableRooms.map(room => <option key={room.id} value={room.id}>Room {room.number} - {room.category}</option>)}
          </select>
          <input className="form-input" type="date" value={form.checkIn} onChange={e=>setForm({...form, checkIn:e.target.value})}/>
          <input className="form-input" type="date" value={form.checkOut} onChange={e=>setForm({...form, checkOut:e.target.value})}/>
          <input className="form-input" type="number" placeholder={form.source === 'OTA' ? "Amount Prepaid by OTA (Gross)" : "Advance amount"} value={form.advance} onChange={e=>setForm({...form, advance:e.target.value})}/>
          <select className="form-input" value={form.source} onChange={e=>setForm({...form, source:e.target.value as 'Direct' | 'OTA'})}>
            <option value="Direct">Direct Booking</option>
            <option value="OTA">Aggregator / OTA</option>
          </select>
          {form.source === 'OTA' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px'}}>
              <select 
                className="form-input" 
                value={form.otaName} 
                onChange={e => {
                  const otaName = e.target.value;
                  const agg = settings.aggregators?.find(a => a.name === otaName);
                  let calculatedCommission = '';
                  if (agg && form.roomId) {
                    const room = rooms.find(r => r.id === form.roomId);
                    if (room) {
                      const rate = settings[`${room.category.toLowerCase()}Rate` as keyof typeof settings] as number || 0;
                      calculatedCommission = String((rate * agg.commissionPercent) / 100);
                    }
                  }
                  setForm({...form, otaName, otaCommission: calculatedCommission});
                }}
              >
                <option value="">Select Aggregator...</option>
                {(settings.aggregators || []).map(agg => (
                  <option key={agg.name} value={agg.name}>{agg.name} ({agg.commissionPercent}%)</option>
                ))}
              </select>
              <input className="form-input" placeholder="Reference / ID" value={form.otaReference} onChange={e=>setForm({...form, otaReference:e.target.value})}/>
              <input className="form-input" type="number" placeholder="Commission (₹)" value={form.otaCommission} onChange={e=>setForm({...form, otaCommission:e.target.value})}/>
            </div>
          )}
          <button className="btn-primary" onClick={() => { createReservation({ name: form.name, mobile: form.mobile }, form.roomId, form.checkIn, form.checkOut, Number(form.advance || 0), form.source, form.otaName, form.otaReference, Number(form.otaCommission || 0)); setForm({ name: '', mobile: '', roomId: '', checkIn: '', checkOut: '', advance: '', source: 'Direct', otaName: '', otaReference: '', otaCommission: '' }); }}>Create Reservation</button>
        </div>
      </div>
      <div style={{flex:2, overflowY:'auto'}}>
        <h2>Upcoming Reserved Rooms</h2>
        <table className="data-table" style={{marginTop:'1rem'}}>
          <thead>
            <tr><th>Room</th><th>Guest</th><th>Source</th><th>Dates</th><th>Advance</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {reservations.map(booking => (
              <tr key={booking.id}>
                <td>{booking.roomNumber}</td>
                <td>{booking.customerName}</td>
                <td>{booking.source === 'OTA' ? <span className="badge" style={{background:'var(--status-blue)', padding:'2px 6px', borderRadius:'4px'}}>{booking.otaName}</span> : 'Direct'}</td>
                <td>{booking.checkIn} to {booking.checkOut}</td>
                <td>₹{booking.advance}</td>
                <td>
                  <button className="btn-text" onClick={() => setArrival({ bookingId: booking.id, idType: 'Aadhaar', idNumber: '', documentName: '' })}>Check In</button>
                  <button className="btn-text text-red" style={{marginLeft:'10px'}} onClick={() => cancelReservation(booking.id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {arrival && arrivalBooking && (
          <div className="glass-panel" style={{padding:'1rem', marginTop:'1rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:'10px'}}>
            <select className="form-input" value={arrival.idType} onChange={e=>setArrival({...arrival, idType:e.target.value})}>
              <option>Aadhaar</option>
              <option>EPIC / Election Card</option>
              <option>Driving License</option>
              <option>Passport</option>
              <option>Other</option>
            </select>
            <input className="form-input" placeholder="Document ID number" value={arrival.idNumber} onChange={e=>setArrival({...arrival, idNumber:e.target.value})}/>
            <input className="form-input" type="file" accept="image/*,.pdf" onChange={e=>setArrival({...arrival, documentName:e.target.files?.[0]?.name || ''})}/>
            <button className="btn-primary" onClick={() => { checkInRoom(arrivalBooking.roomId, arrivalBooking.customerName, arrivalBooking.mobile, arrival.idType, arrival.idNumber, arrival.documentName); setArrival(null); }}>Verify ID & Check In</button>
          </div>
        )}
      </div>
    </div>
  );
}
