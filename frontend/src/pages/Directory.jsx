import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Users, Trash2, Building, Briefcase } from 'lucide-react';

export default function Directory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user permanently?")) {
      try {
        await api.delete(`/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
        toast.success('User deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  if (loading) return <div className="p-6">Loading directory...</div>;

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
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {u.role !== 'admin' && (
                    <button 
                      onClick={() => handleDelete(u.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}
                      title="Delete User"
                    >
                      <Trash2 size={20} />
                    </button>
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
