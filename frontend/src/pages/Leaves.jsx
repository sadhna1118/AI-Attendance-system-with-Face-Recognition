import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { CalendarCheck, CalendarRange, CheckCircle, XCircle, Download } from 'lucide-react';

export default function Leaves() {
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUser();
    fetchLeaves();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves/');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        reason
      };
      await api.post('/leaves/', payload);
      toast.success('Leave requested successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to request leave');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/leaves/${id}?status=${status}`);
      toast.success(`Leave ${status.toLowerCase()}!`);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update leave');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/leaves/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leaves_export_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to export leaves');
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {/* Request Leave Panel */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold flex items-center gap-4 mb-4">
          <CalendarRange size={24}/> Request Leave
        </h2>
        <form onSubmit={handleRequestLeave} className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Start Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input 
              type="date" 
              className="input-field" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              required 
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Reason</label>
            <textarea 
              className="input-field" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              required 
              rows="3"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
            Submit Request
          </button>
        </form>
      </div>

      {/* Leave History/Approvals */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-4">
            <CalendarCheck size={24}/> 
            {user?.role === 'admin' ? 'Manage Employee Leaves' : 'My Leave History'}
          </h2>
          {user?.role === 'admin' && (
            <button onClick={handleExport} className="btn btn-primary flex items-center gap-4">
              <Download size={18} /> Export Leaves
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                {user?.role === 'admin' && <th style={{ padding: '1rem' }}>Employee</th>}
                <th style={{ padding: '1rem' }}>Start Date</th>
                <th style={{ padding: '1rem' }}>End Date</th>
                <th style={{ padding: '1rem' }}>Reason</th>
                <th style={{ padding: '1rem' }}>Status</th>
                {user?.role === 'admin' && <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {user?.role === 'admin' && <td style={{ padding: '1rem', fontWeight: 'bold' }}>{leave.username}</td>}
                  <td style={{ padding: '1rem' }}>{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{leave.reason}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      backgroundColor: leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : leave.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--error)' : '#fbbf24'
                    }}>
                      {leave.status}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {leave.status === 'Pending' && (
                        <>
                          <button onClick={() => handleStatusChange(leave.id, 'Approved')} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }} title="Approve">
                            <CheckCircle size={20} />
                          </button>
                          <button onClick={() => handleStatusChange(leave.id, 'Rejected')} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }} title="Reject">
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? "6" : "4"} className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
