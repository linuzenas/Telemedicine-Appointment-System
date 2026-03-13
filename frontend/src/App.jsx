import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import VideoCall from './pages/VideoCall';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Header with navigation and logout
const Header = () => {
  const { isAuthenticated, user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'patient') return '/patient';
    if (user.role === 'doctor') return '/doctor';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <header className="bg-primary-600 text-white p-4 shadow-md flex justify-between items-center">
      <Link to={isAuthenticated ? getDashboardLink() : '/'} className="text-xl font-bold hover:opacity-90">
        Rural Telemedicine
      </Link>
      <nav className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span className="text-sm opacity-80">Hello, {user?.name}</span>
            <Link to={getDashboardLink()} className="text-sm font-semibold hover:underline">Dashboard</Link>
            <button onClick={handleLogout} className="bg-white text-primary-700 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold hover:underline">Login</Link>
            <Link to="/register" className="bg-white text-primary-700 px-3 py-1 rounded text-sm font-bold hover:bg-gray-100">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
};

const MainLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Header />
    <main className="flex-grow container mx-auto p-4">{children}</main>
    <footer className="bg-gray-800 text-white p-4 text-center mt-auto">
      <p>&copy; 2026 Rural Telemedicine</p>
    </footer>
  </div>
);

const Home = () => (
  <div className="flex flex-col items-center mt-12 text-center">
    <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Rural Telemedicine</h2>
    <p className="text-gray-600 max-w-lg mb-8">Access quality healthcare from the comfort of your home. Connect with verified doctors for consultations and digital prescriptions.</p>
    <div className="flex gap-4">
      <Link to="/login" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700">Login</Link>
      <Link to="/register" className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300">Sign Up</Link>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>
          } />

          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />

          <Route path="/call/:roomName" element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}><VideoCall /></ProtectedRoute>
          } />
        </Routes>
      </MainLayout>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </Router>
  );
}

export default App;
