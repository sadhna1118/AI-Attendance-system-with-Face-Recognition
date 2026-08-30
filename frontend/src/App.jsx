import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterFace from './pages/RegisterFace';
import LiveAttendance from './pages/LiveAttendance';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import Directory from './pages/Directory';
import Sidebar from './components/Sidebar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <ToastContainer theme="dark" position="top-right" autoClose={3000} />
      <div className="app-layout">
        {token && <Sidebar />}
        <main className={`main-content ${!token ? 'full-width' : ''}`}>
          <div className="container">
            <Routes>
              <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/leaves" element={token ? <Leaves /> : <Navigate to="/login" />} />
              <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/directory" element={token ? <Directory /> : <Navigate to="/login" />} />
              <Route path="/register-face" element={token ? <RegisterFace /> : <Navigate to="/login" />} />
              <Route path="/live-attendance" element={token ? <LiveAttendance /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
