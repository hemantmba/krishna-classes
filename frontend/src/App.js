import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SelectTestPage from './pages/SelectTestPage';
import TestPage from './pages/TestPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminUpload from './pages/admin/AdminUpload';
import AdminReports from './pages/admin/AdminReports';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ShareResult from './pages/ShareResult';
import Layout from './components/Layout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ManagerDashboard from './pages/ManagerDashboard';

// Protected route - blocks unauthenticated users
const ProtectedRoute = ({ children, adminOnly = false, managerOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-text">🎓 Krishna Classes</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  if (managerOnly && user.role !== 'manager' && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

// Public route - blocks authenticated users
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-text">🎓 Krishna Classes</div></div>;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'manager') return <Navigate to="/manager" />;
    return <Navigate to="/" />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/result/share/:token" element={<ShareResult />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* Student routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="select-test" element={<SelectTestPage />} />
        <Route path="test" element={<TestPage />} />
        <Route path="result/:id" element={<ResultPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout isAdmin /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="questions" element={<AdminQuestions />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Manager routes */}
      <Route path="/manager" element={<ProtectedRoute managerOnly><Layout isManager /></ProtectedRoute>}>
        <Route index element={<ManagerDashboard />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          toastStyle={{ fontFamily: 'Poppins, sans-serif' }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;