import { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { UserCircle, Briefcase, Building } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      setDepartment(res.data.department || '');
      setDesignation(res.data.designation || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/me', { department, designation });
      toast.success('Profile updated successfully!');
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto', gap: '2rem' }}>
      <div className="glass-panel p-6 text-center">
        <UserCircle size={80} color="var(--accent-color)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
        <h2 className="text-2xl font-bold">{user.username}</h2>
        <p className="text-secondary">{user.email}</p>
        <div style={{ marginTop: '1rem' }}>
          <span style={{ 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '0.85rem',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: 'var(--accent-color)',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase size={20}/> Work Profile</h3>
        <form onSubmit={handleUpdate} className="grid">
          <div>
            <label className="form-label flex items-center gap-2"><Building size={16}/> Department</label>
            <input 
              type="text" 
              className="input-field" 
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              placeholder="e.g. Engineering, HR, Sales"
            />
          </div>
          <div>
            <label className="form-label flex items-center gap-2"><Briefcase size={16}/> Designation</label>
            <input 
              type="text" 
              className="input-field" 
              value={designation} 
              onChange={e => setDesignation(e.target.value)} 
              placeholder="e.g. Software Engineer, Manager"
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
