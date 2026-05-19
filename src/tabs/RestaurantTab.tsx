import { useState } from 'react';
import { useStore } from '../store';
import type { MenuItem, OrderItem } from '../types';

export default function RestaurantTab() {
  const { menuItems, bookings, createOrder, orders, postOrderToRoom, payOrder } = useStore();
  const foodItems = menuItems.filter(m => m.category === 'food' || m.category === 'beverage');
  const activeBookings = bookings.filter(b => b.status === 'active');
  
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [roomNum, setRoomNum] = useState('');
  const [notice, setNotice] = useState('');
  
  const handleAdd = (item: MenuItem) => {
    const existing = selectedItems.find(i => i.menuItemId === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => {
        if (i.menuItemId !== item.id) return i;
        const qty = i.qty + 1;
        const tax = qty * i.rate * item.tax / 100;
        return { ...i, qty, tax, total: qty * i.rate + tax };
      }));
    } else {
      setSelectedItems([...selectedItems, { menuItemId: item.id, name: item.name, qty: 1, rate: item.price, tax: item.price * item.tax / 100, total: item.price + (item.price * item.tax / 100) }]);
    }
    setNotice('');
  };

  const handleOrder = () => {
    if (selectedItems.length === 0) return;
    if (roomNum && !activeBookings.some(b => b.roomNumber === roomNum)) {
      setNotice('No active guest is checked into that room. Use walk-in billing or choose an active room.');
      return;
    }
    createOrder(roomNum || null, roomNum ? 'Room Guest' : 'Walk-in', selectedItems, 'restaurant');
    setSelectedItems([]);
    setRoomNum('');
    setNotice('Order created.');
  };

  const handlePostToRoom = (orderId: string) => {
    const posted = postOrderToRoom(orderId);
    setNotice(posted ? 'Order posted to room credit.' : 'Cannot post to room: credit limit exceeded or no active booking found.');
  };

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', minHeight:'100%'}}>
      <div style={{flex: 2, minWidth: '300px'}}>
        <h2>Restaurant POS</h2>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'10px'}}>
          {foodItems.length === 0 ? (
            <p className="section-subtitle">No menu items are configured in the local database yet.</p>
          ) : foodItems.map(item => (
            <div key={item.id} className="glass-panel" style={{padding:'10px', cursor:'pointer'}} onClick={() => handleAdd(item)}>
              <h4>{item.name}</h4>
              <p>₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel" style={{flex: 1, minWidth: '240px', padding: '1rem', display:'flex', flexDirection:'column'}}>
        <h3>Current Order</h3>
        <select value={roomNum} onChange={e => setRoomNum(e.target.value)} className="form-input" style={{marginBottom:'10px', marginTop:'10px'}}>
          <option value="">Walk-in customer</option>
          {activeBookings.map(b => <option key={b.id} value={b.roomNumber}>Room {b.roomNumber} - {b.customerName}</option>)}
        </select>
        <div style={{flex: 1, overflowY: 'auto'}}>
          {selectedItems.map(i => <div key={i.menuItemId} className="flex-between"><span>{i.qty}x {i.name}</span><span>₹{i.total}</span></div>)}
        </div>
        {notice && <p className={notice.startsWith('Cannot') || notice.startsWith('No active') ? 'text-red' : 'text-green'} style={{fontSize: '0.9rem'}}>{notice}</p>}
        <button className="btn-primary" onClick={handleOrder}>Create Order</button>
      </div>
      
      <div className="glass-panel" style={{flex: 1, minWidth: '240px', padding: '1rem'}}>
        <h3>Active Orders</h3>
        {orders.filter(o => o.type === 'restaurant' && o.status === 'active').length === 0 && (
          <p className="section-subtitle" style={{marginTop: '1rem'}}>No active restaurant orders.</p>
        )}
        {orders.filter(o => o.type === 'restaurant' && o.status === 'active').map(o => (
          <div key={o.id} style={{borderBottom:'1px solid var(--glass-border)', paddingBottom:'10px', marginBottom:'10px'}}>
            <p><strong>{o.id}</strong> - Room {o.roomNumber || 'Walk-in'}</p>
            <p>Total: ₹{o.total}</p>
            <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
              <button className="btn-secondary" onClick={() => payOrder(o.id, 'Cash', '')}>Pay Cash</button>
              {o.roomNumber && <button className="btn-secondary" onClick={() => handlePostToRoom(o.id)}>Post to Room</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
