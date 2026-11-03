import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Users, Trash2, Building, Briefcase, ShieldAlert, RefreshCw } from 'lucide-react';

export default function Directory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/');
      setUsers(res.data);
      setForbidden(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        toast.error('Failed to load user directory');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user permanently?")) {
      try {
        await api.delete(`/users/${id}`);
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.success('User deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  const handleResetFace = async (id, username) => {
    if (window.confirm(`Are you sure you want to reset the registered face for ${username}?`)) {
      try {
        await api.delete(`/users/${id}/face`);
        setUsers(prev => prev.map(u => u.id === id ? { ...u, has_face_encoding: false } : u));
        toast.success(`Face data for ${username} reset successfully!`);
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to reset face data');
      }
    }
  };

  if (loading) return <div className="p-6">Loading directory...</div>;

  if (forbidden) {
    return (
      <div className="glass-panel p-6 text-center" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <ShieldAlert size={48} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-secondary">Only administrators have permission to view and manage the employee directory.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-bold flex items-center gap-4 mb-6">
        <Users size={24} /> Employee Directory
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Employee</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Department</th>
              <th style={{ padding: '1rem' }}>Designation</th>
              <th style={{ padding: '1rem' }}>Face Biometrics</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{u.id}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem',
                    backgroundColor: u.role === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: u.role === 'admin' ? 'var(--accent-color)' : 'var(--text-primary)',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div className="flex items-center gap-2">
                    <Building size={14} color="var(--text-secondary)" />
                    {u.department || '—'}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} color="var(--text-secondary)" />
                    {u.designation || '—'}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    backgroundColor: u.has_face_encoding ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: u.has_face_encoding ? 'var(--success)' : '#fbbf24',
                    fontWeight: 'bold'
                  }}>
                    {u.has_face_encoding ? 'Enrolled' : 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    {u.has_face_encoding && (
                      <button 
                        onClick={() => handleResetFace(u.id, u.username)}
                        style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: '4px' }}
                        title="Reset Registered Face"
                      >
                        <RefreshCw size={18} />
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                  No employees found in directory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
