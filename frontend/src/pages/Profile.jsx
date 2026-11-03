import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { UserCircle, Briefcase, Building, ScanFace, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingFace, setRemovingFace] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      setDepartment(res.data.department || '');
      setDesignation(res.data.designation || '');
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', { 
        department: department.trim(), 
        designation: designation.trim() 
      });
      toast.success('Profile updated successfully!');
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFace = async () => {
    if (!window.confirm("Are you sure you want to remove your registered face? You will need to re-enroll to mark live attendance.")) {
      return;
    }
    setRemovingFace(true);
    try {
      await api.delete('/users/me/face');
      toast.success('Registered face removed successfully!');
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove face');
    } finally {
      setRemovingFace(false);
    }
  };

  if (!user) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto', gap: '2rem' }}>
      <div className="glass-panel p-6 text-center">
        <UserCircle size={80} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
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

      {/* Face Biometrics Card */}
      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
          <ScanFace size={20} color="var(--accent-color)" /> Face Biometrics
        </h3>
        <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>
          Your facial recognition data is used for automatic webcam attendance.
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: user.has_face_encoding ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${user.has_face_encoding ? 'var(--success)' : '#fbbf24'}`
        }}>
          <div className="flex items-center gap-3">
            {user.has_face_encoding ? (
              <CheckCircle2 size={24} color="var(--success)" />
            ) : (
              <AlertCircle size={24} color="#fbbf24" />
            )}
            <div>
              <div style={{ fontWeight: 'bold', color: user.has_face_encoding ? 'var(--success)' : '#fbbf24' }}>
                {user.has_face_encoding ? 'Face Enrolled' : 'Not Enrolled'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {user.has_face_encoding ? '128D mathematical face embeddings active' : 'Enroll face to enable live webcam attendance'}
              </div>
            </div>
          </div>
          {user.has_face_encoding ? (
            <button
              type="button"
              onClick={handleRemoveFace}
              disabled={removingFace}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--error)',
                border: '1px solid var(--error)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={16} />
              {removingFace ? 'Removing...' : 'Remove Face'}
            </button>
          ) : (
            <Link
              to="/register-face"
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Enroll Face Now
            </Link>
          )}
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase size={20}/> Work Profile</h3>
        <form onSubmit={handleUpdate} className="grid" style={{ gap: '1rem' }}>
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
          <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
