import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api';
import type { Me } from './types';
import { FullPageSpinner } from './ui';
import LoginPage from './pages/LoginPage';
import GalleryManager from './pages/GalleryManager';
import AgencyDashboard from './pages/AgencyDashboard';

interface AuthContextValue {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setMe: (me: Me | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  me: null,
  loading: true,
  refresh: async () => {},
  setMe: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function AppRoutes() {
  const { me, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return (
    <Routes>
      <Route path="/login" element={me ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          !me ? (
            <Navigate to="/login" replace />
          ) : me.user.role === 'agency' ? (
            <AgencyDashboard />
          ) : (
            <GalleryManager />
          )
        }
      />
      <Route
        path="/t/:slug"
        element={
          !me ? (
            <Navigate to="/login" replace />
          ) : me.user.role === 'agency' ? (
            <GalleryManager />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMe(await api<Me>('/api/auth/me'));
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ me, loading, refresh, setMe }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
