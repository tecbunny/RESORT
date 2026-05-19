import { useStore } from '../store';

export default function CustomersTab() {
  const { customers, role } = useStore();

  return (
    <div className="customers-content glass-panel animate-fade-in" style={{padding: '1.5rem', minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
      <div className="flex-between" style={{marginBottom: '1.5rem'}}>
        <h2 className="section-title">Customer Records</h2>
      </div>
      <div className="table-container table-responsive" style={{flex: 1, overflowY: 'auto'}}>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Mobile</th><th>ID Type</th><th>ID Copy</th><th>Last Visit</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td style={{fontWeight: 500}}>{c.name}</td>
                <td>{c.mobile}</td>
                <td>{c.idType}</td>
                <td>{c.idDocumentName || 'Not attached'}</td>
                <td>{c.lastVisit}</td>
                <td><span className={`status-badge ${c.status.toLowerCase().replace(' ','-')}`}>{c.status}</span></td>
                <td>
                  <button className="btn-text">View</button>
                  {role === 'owner' && <button className="btn-text text-red" style={{marginLeft: '0.5rem'}}>Edit</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
