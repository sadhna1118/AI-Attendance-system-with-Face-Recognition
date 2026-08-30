import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { UserCircle2, KeyRound } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await api.post('/auth/login', formData);
        localStorage.setItem('token', response.data.access_token);
        window.location.href = '/dashboard';
      } else {
        await api.post('/auth/register', { username, email, password });
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h2 className="text-2xl font-bold text-center mb-4 text-primary">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--error)', borderRadius: '8px', color: '#fca5a5', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <UserCircle2 size={20} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          )}

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={20} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
