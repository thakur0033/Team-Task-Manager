import { Navigate, useLocation } from 'react-router-dom';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); }
  catch { return {}; }
};

/** Requires any logged-in user */
export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!localStorage.getItem('token'))
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

/** Requires role === 'Admin' */
export const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (!localStorage.getItem('token'))
    return <Navigate to="/admin-login" replace state={{ from: location.pathname }} />;
  const user = getUser();
  if (user?.role !== 'Admin') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/admin-login" replace state={{ from: location.pathname, denied: true }} />;
  }
  return children;
};
