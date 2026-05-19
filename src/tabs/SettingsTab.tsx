import { useState } from 'react';
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
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState<ResortSettings>(settings);
  const [saved, setSaved] = useState(false);

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

      <button className="btn-primary" style={{marginTop:'2rem'}} onClick={() => { updateSettings(form); setSaved(true); }}>Save Settings</button>
      {saved && <span className="text-green" style={{marginLeft:'1rem'}}>Settings saved locally.</span>}
    </div>
  );
}
