import { useState, Fragment } from 'react';
import { useStore } from '../store';
import type { StaffDepartment, PaymentMode } from '../types';

const DEPARTMENTS: StaffDepartment[] = ['Front Office', 'Housekeeping', 'Restaurant', 'Bar', 'Kitchen', 'Maintenance', 'Security', 'Management', 'Other'];

export default function StaffTab() {
  const { staff, salaryRecords, leasePayments, addStaff, updateStaff, processSalary, addLeasePayment, markLeasePaid } = useStore();
  const [section, setSection] = useState<'staff' | 'salary' | 'payslip' | 'lease'>('staff');

  // Staff form
  const [staffForm, setStaffForm] = useState({
    name: '', mobile: '', department: 'Front Office' as StaffDepartment, designation: '',
    joiningDate: '', salary: '', bankAccount: '', ifsc: '', aadhaar: '',
  });

  // Salary form
  const [salaryForm, setSalaryForm] = useState({
    staffId: '', month: new Date().toISOString().slice(0, 7),
    advance: '', deductions: '', bonus: '',
    paymentMode: 'Cash' as PaymentMode, transactionRef: '',
  });

  // Lease form
  const [leaseForm, setLeaseForm] = useState({
    description: '', landlord: '', amount: '', dueDate: '', period: '',
  });
  const [leasePayForm, setLeasePayForm] = useState<{ id: string; mode: PaymentMode; ref: string } | null>(null);

  // Payslip selection
  const [payslipId, setPayslipId] = useState('');
  const selectedPayslip = salaryRecords.find(s => s.id === payslipId);

  const activeStaff = staff.filter(s => s.status === 'Active');
  const selectedSalaryStaff = staff.find(s => s.id === salaryForm.staffId);

  return (
    <div className="glass-panel animate-fade-in" style={{padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      {/* Section Tabs */}
      <div style={{display: 'flex', gap: '8px'}}>
        {([['staff', 'Staff Directory'], ['salary', 'Process Salary'], ['payslip', 'Pay Slips'], ['lease', 'Lease & Rent']] as const).map(([key, label]) => (
          <button key={key} className={section === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setSection(key)}>{label}</button>
        ))}
      </div>

      <div style={{flex: 1, display: 'flex', gap: '2rem', overflow: 'hidden'}}>
        {/* ── STAFF DIRECTORY ── */}
        {section === 'staff' && (
          <Fragment>
            <div style={{width: '320px', overflowY: 'auto'}}>
              <h3>Add Staff</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem'}}>
                <input className="form-input" placeholder="Full Name" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
                <input className="form-input" placeholder="Mobile" value={staffForm.mobile} onChange={e => setStaffForm({...staffForm, mobile: e.target.value})} />
                <select className="form-input" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value as StaffDepartment})}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <input className="form-input" placeholder="Designation (e.g. Manager)" value={staffForm.designation} onChange={e => setStaffForm({...staffForm, designation: e.target.value})} />
                <input className="form-input" type="date" value={staffForm.joiningDate} onChange={e => setStaffForm({...staffForm, joiningDate: e.target.value})} />
                <input className="form-input" type="number" placeholder="Monthly Salary (₹)" value={staffForm.salary} onChange={e => setStaffForm({...staffForm, salary: e.target.value})} />
                <input className="form-input" placeholder="Bank Account No." value={staffForm.bankAccount} onChange={e => setStaffForm({...staffForm, bankAccount: e.target.value})} />
                <input className="form-input" placeholder="IFSC Code" value={staffForm.ifsc} onChange={e => setStaffForm({...staffForm, ifsc: e.target.value})} />
                <input className="form-input" placeholder="Aadhaar No." value={staffForm.aadhaar} onChange={e => setStaffForm({...staffForm, aadhaar: e.target.value})} />
                <button className="btn-primary" onClick={() => {
                  if (!staffForm.name) return;
                  addStaff({ ...staffForm, salary: Number(staffForm.salary), status: 'Active' });
                  setStaffForm({ name: '', mobile: '', department: 'Front Office', designation: '', joiningDate: '', salary: '', bankAccount: '', ifsc: '', aadhaar: '' });
                }}>Add Staff Member</button>
              </div>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
              <h3>Staff Directory ({staff.length})</h3>
              <table className="data-table" style={{marginTop: '0.5rem'}}>
                <thead><tr><th>Name</th><th>Department</th><th>Designation</th><th>Salary</th><th>Mobile</th><th>Status</th></tr></thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.department}</td>
                      <td>{s.designation}</td>
                      <td>₹{s.salary.toLocaleString()}</td>
                      <td>{s.mobile}</td>
                      <td>
                        <button className={`btn-text ${s.status === 'Active' ? 'text-green' : 'text-red'}`} onClick={() => updateStaff(s.id, { status: s.status === 'Active' ? 'Inactive' : 'Active' })}>{s.status}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Fragment>
        )}

        {/* ── PROCESS SALARY ── */}
        {section === 'salary' && (
          <Fragment>
            <div style={{width: '320px', overflowY: 'auto'}}>
              <h3>Process Salary</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem'}}>
                <select className="form-input" value={salaryForm.staffId} onChange={e => setSalaryForm({...salaryForm, staffId: e.target.value})}>
                  <option value="">Select Staff</option>
                  {activeStaff.map(s => <option key={s.id} value={s.id}>{s.name} — ₹{s.salary.toLocaleString()}</option>)}
                </select>
                <input className="form-input" type="month" value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})} />
                {selectedSalaryStaff && (
                  <div style={{padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.9rem'}}>
                    Basic: ₹{selectedSalaryStaff.salary.toLocaleString()}
                  </div>
                )}
                <input className="form-input" type="number" placeholder="Advance Deduction (₹)" value={salaryForm.advance} onChange={e => setSalaryForm({...salaryForm, advance: e.target.value})} />
                <input className="form-input" type="number" placeholder="Other Deductions (₹)" value={salaryForm.deductions} onChange={e => setSalaryForm({...salaryForm, deductions: e.target.value})} />
                <input className="form-input" type="number" placeholder="Bonus / Incentive (₹)" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: e.target.value})} />
                {selectedSalaryStaff && (
                  <div style={{padding: '10px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)'}}>
                    <strong>Net Pay: ₹{(selectedSalaryStaff.salary + Number(salaryForm.bonus || 0) - Number(salaryForm.advance || 0) - Number(salaryForm.deductions || 0)).toLocaleString()}</strong>
                  </div>
                )}
                <select className="form-input" value={salaryForm.paymentMode} onChange={e => setSalaryForm({...salaryForm, paymentMode: e.target.value as PaymentMode})}>
                  <option>Cash</option><option>UPI</option><option>Net Banking</option><option>Card</option>
                </select>
                <input className="form-input" placeholder="Transaction Ref" value={salaryForm.transactionRef} onChange={e => setSalaryForm({...salaryForm, transactionRef: e.target.value})} />
                <button className="btn-primary" onClick={() => {
                  if (!salaryForm.staffId) return;
                  processSalary(salaryForm.staffId, salaryForm.month, Number(salaryForm.advance || 0), Number(salaryForm.deductions || 0), Number(salaryForm.bonus || 0), salaryForm.paymentMode, salaryForm.transactionRef);
                  setSalaryForm({ ...salaryForm, staffId: '', advance: '', deductions: '', bonus: '', transactionRef: '' });
                }}>Process & Pay</button>
              </div>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
              <h3>Salary History</h3>
              <table className="data-table" style={{marginTop: '0.5rem'}}>
                <thead><tr><th>Month</th><th>Staff</th><th>Basic</th><th>Adv</th><th>Ded</th><th>Bonus</th><th>Net Pay</th><th>Mode</th></tr></thead>
                <tbody>
                  {salaryRecords.map(r => (
                    <tr key={r.id}>
                      <td>{r.month}</td>
                      <td>{r.staffName}</td>
                      <td>₹{r.basicSalary.toLocaleString()}</td>
                      <td style={{color: 'var(--status-red)'}}>₹{r.advance}</td>
                      <td style={{color: 'var(--status-red)'}}>₹{r.deductions}</td>
                      <td style={{color: 'var(--status-green)'}}>₹{r.bonus}</td>
                      <td style={{fontWeight: 'bold'}}>₹{r.netPay.toLocaleString()}</td>
                      <td>{r.paymentMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Fragment>
        )}

        {/* ── PAY SLIPS ── */}
        {section === 'payslip' && (
          <Fragment>
            <div style={{width: '320px', overflowY: 'auto'}}>
              <h3>Select Pay Slip</h3>
              <select className="form-input" style={{marginTop: '0.5rem'}} value={payslipId} onChange={e => setPayslipId(e.target.value)}>
                <option value="">Choose...</option>
                {salaryRecords.map(r => <option key={r.id} value={r.id}>{r.staffName} — {r.month}</option>)}
              </select>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
              {selectedPayslip ? (
                <div className="printable-area" style={{background: 'white', color: '#111', padding: '2rem', borderRadius: '8px', maxWidth: '600px'}}>
                  <h2 style={{textAlign: 'center', marginBottom: '0.5rem'}}>PAY SLIP</h2>
                  <p style={{textAlign: 'center', color: '#666', marginBottom: '1.5rem'}}>Month: {selectedPayslip.month}</p>
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <tbody>
                      <tr><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Employee Name</td><td style={{padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold'}}>{selectedPayslip.staffName}</td></tr>
                      <tr><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Employee ID</td><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>{selectedPayslip.staffId}</td></tr>
                      <tr><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Basic Salary</td><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>₹{selectedPayslip.basicSalary.toLocaleString()}</td></tr>
                      <tr><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Bonus / Incentive</td><td style={{padding: '8px', borderBottom: '1px solid #ddd', color: 'green'}}>+ ₹{selectedPayslip.bonus.toLocaleString()}</td></tr>
                      <tr><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Advance Deduction</td><td style={{padding: '8px', borderBottom: '1px solid #ddd', color: 'red'}}>- ₹{selectedPayslip.advance.toLocaleString()}</td></tr>
                      <tr><td style={{padding: '8px', borderBottom: '1px solid #ddd'}}>Other Deductions</td><td style={{padding: '8px', borderBottom: '1px solid #ddd', color: 'red'}}>- ₹{selectedPayslip.deductions.toLocaleString()}</td></tr>
                      <tr style={{background: '#f0f0f0'}}><td style={{padding: '10px', fontWeight: 'bold', fontSize: '1.1rem'}}>Net Pay</td><td style={{padding: '10px', fontWeight: 'bold', fontSize: '1.1rem'}}>₹{selectedPayslip.netPay.toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                  <div style={{marginTop: '1rem', fontSize: '0.85rem', color: '#888'}}>
                    <p>Payment Mode: {selectedPayslip.paymentMode} {selectedPayslip.transactionRef ? `| Ref: ${selectedPayslip.transactionRef}` : ''}</p>
                    <p>Paid On: {selectedPayslip.paidDate}</p>
                  </div>
                  <button className="btn-primary no-print" style={{marginTop: '1rem'}} onClick={() => window.print()}>Print Pay Slip</button>
                </div>
              ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)'}}>Select a pay slip from the left to preview & print.</div>
              )}
            </div>
          </Fragment>
        )}

        {/* ── LEASE & RENT ── */}
        {section === 'lease' && (
          <Fragment>
            <div style={{width: '320px', overflowY: 'auto'}}>
              <h3>Add Lease / Rent</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem'}}>
                <input className="form-input" placeholder="Description (e.g. Resort Building Rent)" value={leaseForm.description} onChange={e => setLeaseForm({...leaseForm, description: e.target.value})} />
                <input className="form-input" placeholder="Landlord / Owner Name" value={leaseForm.landlord} onChange={e => setLeaseForm({...leaseForm, landlord: e.target.value})} />
                <input className="form-input" type="number" placeholder="Amount (₹)" value={leaseForm.amount} onChange={e => setLeaseForm({...leaseForm, amount: e.target.value})} />
                <input className="form-input" type="date" placeholder="Due Date" value={leaseForm.dueDate} onChange={e => setLeaseForm({...leaseForm, dueDate: e.target.value})} />
                <input className="form-input" placeholder="Period (e.g. May 2026)" value={leaseForm.period} onChange={e => setLeaseForm({...leaseForm, period: e.target.value})} />
                <button className="btn-primary" onClick={() => {
                  if (!leaseForm.description || !leaseForm.amount) return;
                  addLeasePayment(leaseForm.description, leaseForm.landlord, Number(leaseForm.amount), leaseForm.dueDate, leaseForm.period);
                  setLeaseForm({ description: leaseForm.description, landlord: leaseForm.landlord, amount: leaseForm.amount, dueDate: '', period: '' });
                }}>Add Lease Entry</button>
              </div>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
              <h3>Lease & Rent Ledger</h3>
              <table className="data-table" style={{marginTop: '0.5rem'}}>
                <thead><tr><th>Description</th><th>Landlord</th><th>Period</th><th>Amount</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {leasePayments.map(l => (
                    <tr key={l.id}>
                      <td>{l.description}</td>
                      <td>{l.landlord}</td>
                      <td>{l.period}</td>
                      <td style={{fontWeight: 'bold'}}>₹{l.amount.toLocaleString()}</td>
                      <td>{l.dueDate}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem',
                          background: l.status === 'Paid' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                          color: l.status === 'Paid' ? '#10b981' : '#f59e0b',
                        }}>{l.status}</span>
                      </td>
                      <td>
                        {l.status === 'Pending' && (
                          leasePayForm?.id === l.id ? (
                            <div style={{display: 'flex', gap: '4px'}}>
                              <select className="form-input" style={{width: '80px', padding: '4px'}} value={leasePayForm.mode} onChange={e => setLeasePayForm({...leasePayForm, mode: e.target.value as PaymentMode})}>
                                <option>Cash</option><option>UPI</option><option>Net Banking</option><option>Card</option>
                              </select>
                              <input className="form-input" style={{width: '80px', padding: '4px'}} placeholder="Ref" value={leasePayForm.ref} onChange={e => setLeasePayForm({...leasePayForm, ref: e.target.value})} />
                              <button className="btn-text text-green" onClick={() => { markLeasePaid(l.id, leasePayForm.mode, leasePayForm.ref); setLeasePayForm(null); }}>✓</button>
                            </div>
                          ) : (
                            <button className="btn-text text-green" onClick={() => setLeasePayForm({ id: l.id, mode: 'Cash', ref: '' })}>Mark Paid</button>
                          )
                        )}
                        {l.status === 'Paid' && <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Paid: {l.paidDate}</span>}
                      </td>
                    </tr>
                  ))}
                  {leasePayments.length === 0 && (
                    <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>No lease/rent entries yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
}
