import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const authed = !!localStorage.getItem('adm_token');
  return authed ? children : <Navigate to="/login" replace />;
}
