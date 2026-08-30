import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, UserPlus, LogOut, CalendarCheck, User, Moon, Sun, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Live Attendance', path: '/live-attendance', icon: <Camera size={20} /> },
    { name: 'Leaves', path: '/leaves', icon: <CalendarCheck size={20} /> },
    { name: 'Register Face', path: '/register-face', icon: <UserPlus size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Directory', path: '/directory', icon: <Users size={20} /> },
  ];

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h2 className="text-xl font-bold text-accent">FaceTrack Pro</h2>
      </div>
      
      <div className="sidebar-nav">
        {navItems.map(item => (
          <Link 
            key={item.name} 
            to={item.path} 
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button onClick={toggleTheme} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={handleLogout} className="nav-link logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
