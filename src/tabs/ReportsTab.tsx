import { useStore } from '../store';

export default function ReportsTab() {
  const { auditLogs, payments, bookings } = useStore();
  const totalRevenue = payments.filter(p => !p.reversed && p.mode !== 'OTA Commission').reduce((a, p) => a + p.amount, 0);

  const otaStats = bookings.filter(b => b.source === 'OTA').reduce((acc, b) => {
    const name = b.otaName || 'Unknown OTA';
    if (!acc[name]) acc[name] = { count: 0, gross: 0, commission: 0 };
    acc[name].count++;
    acc[name].gross += b.totalBilled || b.tariff;
    acc[name].commission += b.otaCommission || 0;
    return acc;
  }, {} as Record<string, { count: number; gross: number; commission: number }>);

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', height: '100%', display:'flex', gap:'2rem'}}>
      <div style={{flex: 1}}>
        <h2>Owner Analytics</h2>
        <div className="glass-panel" style={{padding:'1rem', marginTop:'1rem', display:'flex', flexDirection:'column', gap:'10px'}}>
          <p style={{fontSize:'1.2rem'}}>Total Collected: <span style={{color:'var(--status-green)', fontWeight:'bold'}}>₹{totalRevenue}</span></p>
          <p>Cash Payments: {payments.filter(p => p.mode === 'Cash').length}</p>
          <p>UPI Payments: {payments.filter(p => p.mode === 'UPI').length}</p>
          <p>Card Payments: {payments.filter(p => p.mode === 'Card').length}</p>
        </div>
        
        <h2 style={{marginTop: '2rem'}}>Aggregator (OTA) Report</h2>
        <div className="glass-panel" style={{padding:'1rem', marginTop:'1rem', display:'flex', flexDirection:'column', gap:'10px'}}>
          {Object.keys(otaStats).length === 0 ? (
            <p>No aggregator bookings found.</p>
          ) : (
            Object.entries(otaStats).map(([name, stats]) => (
              <div key={name} style={{borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'}}>
                <h3 style={{color: 'var(--status-blue)'}}>{name}</h3>
                <p>Total Bookings: {stats.count}</p>
                <p>Gross Revenue: ₹{stats.gross}</p>
                <p style={{color: 'var(--status-red)'}}>Commission Charged: ₹{stats.commission}</p>
                <p style={{fontWeight: 'bold'}}>Net Settlement Due: ₹{stats.gross - stats.commission}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div style={{flex: 2, overflowY: 'auto'}}>
        <h2>Audit Log</h2>
        <table className="data-table" style={{marginTop:'1rem'}}>
          <thead>
            <tr><th>Time</th><th>User</th><th>Action</th><th>Reason</th></tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.userName}</td>
                <td>{log.action} on {log.entity}</td>
                <td>{log.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
