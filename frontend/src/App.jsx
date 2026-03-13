import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useLanguage } from './context/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import VideoCall from './pages/VideoCall';
import NotificationBell from './components/NotificationBell';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Header with navigation and logout
const Header = () => {
  const { isAuthenticated, user, logout } = useStore();
  const { t, lang, toggleLanguage } = useLanguage();
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
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 shadow-lg flex justify-between items-center flex-wrap gap-2">
      <Link to={isAuthenticated ? getDashboardLink() : '/'} className="text-xl font-bold hover:opacity-90 flex items-center gap-2">
        <span className="text-2xl">🏥</span> {t('appName')}
      </Link>
      <nav className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <button onClick={toggleLanguage} className="bg-white/10 px-3 py-1 rounded-full text-sm font-bold hover:bg-white/20 transition">
          {t('switchLang')}
        </button>
        <NotificationBell />
        {isAuthenticated ? (
          <>
            <span className="text-sm opacity-80 hidden sm:block">{t('hello')}, {user?.name}</span>
            <Link to={getDashboardLink()} className="text-sm font-semibold hover:underline">{t('dashboard')}</Link>
            <button onClick={handleLogout} className="bg-white/20 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-white/30 transition">
              {t('logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold hover:underline">{t('login')}</Link>
            <Link to="/register" className="bg-white text-primary-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition">{t('signUp')}</Link>
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
    <footer className="bg-gray-800 text-white p-6 text-center mt-auto">
      <p className="text-sm opacity-70">&copy; 2026 Rural Telemedicine — Bridging Healthcare for Rural India</p>
    </footer>
  </div>
);

// Landing Page with rural accessibility emphasis
const Home = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-12 py-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 whitespace-pre-wrap">
          {t('heroTitle')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {t('heroSubtitle')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/register" className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary-700 transition shadow-lg">
            {t('getStarted')}
          </Link>
          <Link to="/login" className="bg-white text-primary-700 border-2 border-primary-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary-50 transition">
            {t('login')}
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition">
          <div className="text-4xl mb-3">📱</div>
          <h3 className="font-bold text-lg mb-2">{t('easyToUse')}</h3>
          <p className="text-gray-500 text-sm">{t('easyToUseDesc')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition">
          <div className="text-4xl mb-3">🎥</div>
          <h3 className="font-bold text-lg mb-2">{t('videoConsultation')}</h3>
          <p className="text-gray-500 text-sm">{t('videoConsultationDesc')}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition">
          <div className="text-4xl mb-3">💊</div>
          <h3 className="font-bold text-lg mb-2">{t('digitalPrescription')}</h3>
          <p className="text-gray-500 text-sm">{t('digitalPrescriptionDesc')}</p>
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{t('howItWorks')}</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: '1', title: t('step1'), desc: t('step1Desc') },
            { step: '2', title: t('step2'), desc: t('step2Desc') },
            { step: '3', title: t('step3'), desc: t('step3Desc') },
            { step: '4', title: t('step4'), desc: t('step4Desc') },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h4 className="font-bold text-gray-800">{item.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-primary-50 p-8 rounded-xl max-w-4xl mx-auto text-center">
        <h3 className="font-bold text-lg text-primary-800 mb-4">{t('builtForRural')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="font-bold text-primary-700 text-xl">{t('free')}</p>
            <p className="text-gray-500">{t('noPlatformFees')}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="font-bold text-primary-700 text-xl">{t('secure')}</p>
            <p className="text-gray-500">{t('privateEncrypted')}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="font-bold text-primary-700 text-xl">{t('simple')}</p>
            <p className="text-gray-500">{t('minimalSteps')}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="font-bold text-primary-700 text-xl">{t('available247')}</p>
            <p className="text-gray-500">{t('accessAnytime')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
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
          <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/call/:roomName" element={<ProtectedRoute allowedRoles={['patient', 'doctor']}><VideoCall /></ProtectedRoute>} />
        </Routes>
      </MainLayout>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </Router>
  );
}

export default App;
