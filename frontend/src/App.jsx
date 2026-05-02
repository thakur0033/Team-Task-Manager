import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminProtectedRoute } from './components/Guards.jsx';
import Navbar      from './components/Navbar.jsx';
import Login       from './pages/Login.jsx';
import AdminLogin  from './pages/AdminLogin.jsx';
import Dashboard   from './pages/Dashboard.jsx';
import Tasks       from './pages/Tasks.jsx';
import Projects    from './pages/Projects.jsx';

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/login"       element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Navbar /><Dashboard /></ProtectedRoute>} />
      <Route path="/tasks"     element={<ProtectedRoute><Navbar /><Tasks /></ProtectedRoute>} />
      <Route path="/projects"  element={<ProtectedRoute><Navbar /><Projects /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
