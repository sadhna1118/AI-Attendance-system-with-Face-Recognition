import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download, Users, CheckCircle, Clock, BarChart3, Trash2, ShieldAlert, MonitorPlay } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchAttendance();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance/');
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/attendance/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_export_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await api.delete(`/attendance/${id}`);
        setAttendance(attendance.filter(record => record.id !== id));
        toast.success('Record deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to delete record');
      }
    }
  };

  const chartData = useMemo(() => {
    const counts = {};
    attendance.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.keys(counts).map(date => ({ date, count: counts[date] })).reverse();
  }, [attendance]);

  const kpis = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayRecords = attendance.filter(r => new Date(r.timestamp).toDateString() === todayStr);
    
    // Unique users present today
    const presentUsers = new Set(todayRecords.map(r => r.username)).size;
    const lateUsers = new Set(todayRecords.filter(r => r.is_late).map(r => r.username)).size;

    return {
      presentToday: presentUsers,
      lateToday: lateUsers,
      totalScansToday: todayRecords.length
    };
  }, [attendance]);

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
      
      {/* Welcome & Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Welcome, {user?.username || 'User'}!</h2>
            <p className="text-secondary mt-2">Manage your attendance efficiently.</p>
            {user?.role === 'admin' && (
              <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', borderRadius: '12px', background: 'var(--accent-color)', color: '#000', fontSize: '0.8rem', fontWeight: 'bold' }}>
                ADMIN
              </span>
            )}
          </div>
          <Users size={48} color="var(--accent-color)" style={{ opacity: 0.5 }} />
        </div>
        
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <p className="text-secondary mb-2">Face Registration</p>
            <h3 className="text-xl font-bold" style={{ color: user?.has_face_encoding ? 'var(--success)' : 'var(--error)' }}>
              {user?.has_face_encoding ? 'Enrolled' : 'Pending'}
            </h3>
          </div>
          <CheckCircle size={40} color={user?.has_face_encoding ? "var(--success)" : "var(--error)"} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-bold">Present Today</h3>
            <Users size={20} color="var(--success)" />
          </div>
          <div className="text-2xl font-bold">{kpis.presentToday}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-bold">Late Today</h3>
            <ShieldAlert size={20} color="var(--error)" />
          </div>
          <div className="text-2xl font-bold">{kpis.lateToday}</div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-bold">Total Scans Today</h3>
            <MonitorPlay size={20} color="var(--accent-color)" />
          </div>
          <div className="text-2xl font-bold">{kpis.totalScansToday}</div>
        </div>
      </div>

      {/* Analytics Chart */}
      {chartData.length > 0 && (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold flex items-center gap-4 mb-6">
            <BarChart3 size={24}/> Attendance Trends
          </h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent-color)' }}
                />
                <Bar dataKey="count" fill="var(--accent-color)" radius={[4, 4, 0, 0]} name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attendance Logs */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-4">
            <Clock size={24}/> 
            {user?.role === 'admin' ? 'All Employee Logs (Admin)' : 'My Recent Logs'}
          </h2>
          <button onClick={handleExport} className="btn btn-primary flex items-center gap-4">
            <Download size={18} /> Export Excel
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Time</th>
                <th style={{ padding: '1rem' }}>IP Address</th>
                <th style={{ padding: '1rem' }}>Status</th>
                {user?.role === 'admin' && <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {attendance.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>#{record.id}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{record.username}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      backgroundColor: record.type === 'Check-in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: record.type === 'Check-in' ? 'var(--success)' : '#fbbf24',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {record.type || 'Check-in'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {new Date(record.timestamp).toLocaleString()}
                    {record.is_late && (
                      <span style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.7rem', backgroundColor: 'var(--error)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>
                        LATE
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {record.ip_address || '—'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem',
                      backgroundColor: record.status.includes('Present') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: record.status.includes('Present') ? 'var(--success)' : 'var(--error)'
                    }}>
                      {record.status}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(record.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.8 }} title="Delete Record">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'admin' ? "7" : "6"} className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                    No attendance records found.
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
