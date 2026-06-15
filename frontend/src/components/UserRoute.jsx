import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UserRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'user') {
    return <Navigate to="/" replace />;
  }

  return children;
}
