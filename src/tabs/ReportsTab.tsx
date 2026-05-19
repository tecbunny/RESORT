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
    <div className="glass-panel animate-fade-in reports-tab-container" style={{padding: '1.5rem', height: '100%', overflowY: 'auto'}}>
      <div className="reports-tab-stats-column" style={{flex: 1}}>
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
      <div className="reports-tab-log-column" style={{flex: 2}}>
        <h2>Audit Log Trail</h2>
        <div className="table-responsive">
          <table className="data-table" style={{marginTop:'1rem'}}>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Change Detail</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{fontWeight: 500, textTransform: 'capitalize'}}>{log.userName}</td>
                  <td><span className="status-badge active" style={{fontSize: '0.75rem', padding: '2px 6px'}}>{log.action}</span></td>
                  <td>{log.entity} ({log.entityId})</td>
                  <td style={{fontSize: '0.8rem', fontFamily: 'monospace'}}>
                    {log.oldValue && log.oldValue !== 'N/A' && log.oldValue !== 'No charge' && log.oldValue !== 'Cash' && log.oldValue !== 'Active' ? (
                      <span style={{color: 'var(--text-secondary)'}}>{log.oldValue} ➔ <strong style={{color: 'var(--status-green)'}}>{log.newValue}</strong></span>
                    ) : (
                      <span style={{color: 'var(--text-primary)'}}>{log.newValue}</span>
                    )}
                  </td>
                  <td>{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
