import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PublicHome } from './PublicHome';

export function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <PublicHome />;
  }
  if (user.role === 'administrator') return <Navigate to="/admin" replace />;
  if (user.role === 'organiser') return <Navigate to="/organiser" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}
