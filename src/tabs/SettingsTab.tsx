import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { ResortSettings } from '../types';

const numberFields: (keyof ResortSettings)[] = [
  'defaultCreditLimit',
  'defaultCleaningFee',
  'lateCheckoutFee',
  'standardRate',
  'deluxeRate',
  'suiteRate',
  'executiveRate',
  'sgstRate',
  'cgstRate',
];

export default function SettingsTab() {
  const { settings, updateSettings, createUser, deleteUser, userName: loggedInUser } = useStore();
  const [form, setForm] = useState<ResortSettings>(settings);
  const [saved, setSaved] = useState(false);

  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'reception' });
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Keep local form in sync with global store settings (for cloud loads & user updates)
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    
    if (!newUser.username.trim() || newUser.password.length < 6) {
      setUserError('Password must be at least 6 characters.');
      return;
    }
    
    const success = await createUser(newUser.username.trim(), newUser.password, newUser.role as any);
    if (success) {
      setUserSuccess(`Account "${newUser.username}" created successfully!`);
      setNewUser({ username: '', password: '', role: 'reception' });
    } else {
      setUserError('Failed to create account. Username might already exist.');
    }
  };

  const setValue = (key: keyof ResortSettings, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: numberFields.includes(key) ? Number(value) : value,
    }));
    setSaved(false);
  };

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', height: '100%', overflowY: 'auto'}}>
      <h2 className="section-title">Owner Settings</h2>
      <p className="section-subtitle">Operational defaults used by check-in, credit limit checks, cleaning charges, and invoice display.</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1rem', marginTop:'1.5rem'}}>
        {([
          ['resortName', 'Resort Name'],
          ['address', 'Address'],
          ['gstin', 'GSTIN'],
          ['phone', 'Phone'],
          ['email', 'Email'],
          ['checkoutTime', 'Checkout Time'],
          ['defaultCreditLimit', 'Default Credit Limit'],
          ['defaultCleaningFee', 'Extra Cleaning Fee'],
          ['lateCheckoutFee', 'Late Checkout Fee'],
          ['standardRate', 'Standard Rate'],
          ['deluxeRate', 'Deluxe Rate'],
          ['suiteRate', 'Suite Rate'],
          ['executiveRate', 'Executive Rate'],
          ['cgstRate', 'CGST %'],
          ['sgstRate', 'SGST %'],
        ] as [keyof ResortSettings, string][]).map(([key, label]) => (
          <label key={key} className="form-group">
            <span>{label}</span>
            <input
              className="form-input"
              type={numberFields.includes(key) ? 'number' : key === 'checkoutTime' ? 'time' : 'text'}
              value={String(form[key])}
              onChange={e => setValue(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      
      <h3 className="section-title" style={{marginTop: '2rem'}}>Aggregators (OTAs)</h3>
      <p className="section-subtitle">Configure third-party booking platforms and their default commission percentages.</p>
      <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginTop:'1rem', maxWidth: '600px'}}>
        {(form.aggregators || []).map((agg, idx) => (
          <div key={idx} style={{display:'flex', gap:'1rem', alignItems:'center'}}>
            <input 
              className="form-input" 
              placeholder="OTA Name (e.g. Agoda)" 
              value={agg.name} 
              onChange={e => {
                const newAggs = [...(form.aggregators || [])];
                newAggs[idx].name = e.target.value;
                setForm({...form, aggregators: newAggs});
                setSaved(false);
              }}
              style={{flex: 2}}
            />
            <input 
              className="form-input" 
              type="number" 
              placeholder="Commission %" 
              value={agg.commissionPercent} 
              onChange={e => {
                const newAggs = [...(form.aggregators || [])];
                newAggs[idx].commissionPercent = Number(e.target.value);
                setForm({...form, aggregators: newAggs});
                setSaved(false);
              }}
              style={{flex: 1}}
            />
            <button 
              className="btn-text text-red" 
              onClick={() => {
                const newAggs = form.aggregators.filter((_, i) => i !== idx);
                setForm({...form, aggregators: newAggs});
                setSaved(false);
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button 
          className="btn-secondary" 
          style={{alignSelf: 'flex-start'}} 
          onClick={() => {
            setForm({...form, aggregators: [...(form.aggregators || []), { name: '', commissionPercent: 15 }]});
            setSaved(false);
          }}
        >
          + Add Aggregator
        </button>
      </div>

      <h3 className="section-title" style={{marginTop: '2.5rem'}}>User Access Management</h3>
      <p className="section-subtitle">Create and manage secure staff logins for different resort departments.</p>
      
      <div style={{display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap'}}>
        {/* User Accounts List */}
        <div className="glass-panel" style={{flex: '1 1 350px', padding: '1.2rem', minWidth: '300px'}}>
          <h4 style={{marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Active Accounts</h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
            {(settings.userCredentials || []).map((cred) => (
              <div key={cred.username} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div>
                  <strong style={{textTransform: 'capitalize'}}>{cred.username}</strong>
                  <span className={`status-badge ${cred.role === 'owner' ? 'active' : cred.role === 'reception' ? 'progress' : 'cleaning'}`} style={{fontSize: '0.75rem', marginLeft: '0.5rem', padding: '1px 6px'}}>
                    {cred.role}
                  </span>
                </div>
                {cred.username.toLowerCase() !== loggedInUser.toLowerCase() ? (
                  <button 
                    className="btn-text text-red" 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the login for "${cred.username}"?`)) {
                        deleteUser(cred.username);
                      }
                    }}
                    style={{fontSize: '0.85rem'}}
                  >
                    Delete
                  </button>
                ) : (
                  <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic'}}>Active (You)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create User Form */}
        <form onSubmit={handleCreateUser} className="glass-panel" style={{flex: '1 1 350px', padding: '1.2rem', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <h4 style={{marginBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem'}}>Create New User</h4>
          
          <div className="form-group">
            <span style={{fontSize: '0.9rem'}}>Username</span>
            <input 
              required
              className="form-input" 
              placeholder="e.g. receptionist2"
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
            />
          </div>

          <div className="form-group">
            <span style={{fontSize: '0.9rem'}}>Password</span>
            <input 
              required
              type="password"
              className="form-input" 
              placeholder="Min 6 characters"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />
          </div>

          <div className="form-group">
            <span style={{fontSize: '0.9rem'}}>System Role</span>
            <select 
              className="form-input"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="owner">Owner (Full Admin Access)</option>
              <option value="reception">Receptionist (Front Office & Bills)</option>
              <option value="restaurant">Restaurant (POS & Menu Only)</option>
            </select>
          </div>

          {userError && <p className="text-red" style={{fontSize: '0.85rem', margin: 0}}>{userError}</p>}
          {userSuccess && <p className="text-green" style={{fontSize: '0.85rem', margin: 0}}>{userSuccess}</p>}

          <button type="submit" className="btn-secondary" style={{marginTop: '0.5rem', width: 'fit-content'}}>
            + Create Account
          </button>
        </form>
      </div>

      <div style={{marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem'}}>
        <button className="btn-primary" onClick={() => { updateSettings(form); setSaved(true); }}>Save Global Settings</button>
        {saved && <span className="text-green" style={{fontWeight: 500}}>Settings saved to cloud and synced!</span>}
      </div>
    </div>
  );
}
