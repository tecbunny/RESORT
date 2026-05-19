import { useState, useRef } from 'react';
import { useStore } from '../store';
import type { StockMovement } from '../types';

type InventoryImportRow = Record<string, string | undefined>;

function parseCsv(text: string): InventoryImportRow[] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(current.trim());
      current = '';
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);

  const [headers = [], ...dataRows] = rows;
  return dataRows.map(dataRow => {
    const output: InventoryImportRow = {};
    headers.forEach((header, index) => {
      output[header.trim()] = dataRow[index]?.trim();
    });
    return output;
  });
}

export default function BarTab() {
  const { inventory, addStockMovement, importInventory } = useStore();
  const [movement, setMovement] = useState({ itemId: '', type: 'purchase' as StockMovement['type'], qty: '', reason: '' });
  const [importNotice, setImportNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportNotice('Upload a CSV file with Name, Category, Stock, Unit, and MinStock columns.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const csv = String(evt.target?.result || '');
        const data = parseCsv(csv);
        
        const parsedItems = data.map((row) => ({
          name: String(row.Name || row.name || row.Item || 'Unknown'),
          category: String(row.Category || row.category || 'Bar'),
          currentStock: Number(row.Stock || row.stock || row.currentStock || row.Qty) || 0,
          unit: String(row.Unit || row.unit || 'btl'),
          minStockLevel: Number(row.MinStock || row.minStockLevel || row.Threshold) || 10
        }));
        
        importInventory(parsedItems);
        setImportNotice(`Imported ${parsedItems.length} inventory item${parsedItems.length === 1 ? '' : 's'}.`);
      } catch (err) {
        console.error(err);
        setImportNotice('Import failed. Ensure the CSV has Name, Category, Stock, Unit, and MinStock columns.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', height: '100%', display:'flex', flexDirection:'column'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
        <h2>Bar Inventory</h2>
        <div>
          <input type="file" accept=".csv,text/csv" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileUpload} />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Upload CSV</button>
        </div>
      </div>
      {importNotice && <p className="section-subtitle" style={{marginBottom: '1rem'}}>{importNotice}</p>}
      <div className="glass-panel" style={{padding:'1rem', marginBottom:'1rem', display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr auto', gap:'10px'}}>
        <select className="form-input" value={movement.itemId} onChange={e=>setMovement({...movement, itemId: e.target.value})}>
          <option value="">Select item</option>
          {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="form-input" value={movement.type} onChange={e=>setMovement({...movement, type: e.target.value as StockMovement['type']})}>
          <option value="purchase">Purchase</option>
          <option value="adjustment">Adjustment</option>
          <option value="waste">Waste</option>
        </select>
        <input className="form-input" type="number" placeholder="Qty" value={movement.qty} onChange={e=>setMovement({...movement, qty: e.target.value})}/>
        <input className="form-input" placeholder="Reason" value={movement.reason} onChange={e=>setMovement({...movement, reason: e.target.value})}/>
        <button className="btn-primary" onClick={() => { addStockMovement(movement.itemId, movement.type, Number(movement.qty), movement.reason || movement.type); setMovement({ itemId: '', type: 'purchase', qty: '', reason: '' }); }}>Save</button>
      </div>
      <div style={{flex: 1, overflowY: 'auto'}}>
        <table className="data-table">
          <thead>
            <tr><th>Item</th><th>Category</th><th>Current Stock</th><th>Status</th></tr>
          </thead>
          <tbody>
            {inventory.length === 0 && (
              <tr>
                <td colSpan={4} className="section-subtitle">No inventory items in the local database. Upload a CSV file to begin.</td>
              </tr>
            )}
            {inventory.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.currentStock} {item.unit}</td>
                <td>
                  {item.currentStock <= item.lowStockThreshold ? (
                    <span className="status-badge inactive">Low Stock</span>
                  ) : (
                    <span className="status-badge active">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
