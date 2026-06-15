import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DoctorRoute({ children, requireVerified = true }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'pending_doctor') {
    if (requireVerified) {
      return <Navigate to="/doctor-verification" replace />;
    }
    return children;
  }

  if (user.role !== 'doctor' && user.role !== 'admin') {
    return <Navigate to="/user-chat" replace />;
  }

  return children;
}
