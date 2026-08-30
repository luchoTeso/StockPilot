import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// Ensure all requests send the session cookie through the Vite proxy
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // INTERCEPTOR GLOBAL DE SEGURIDAD
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const isConcurrent = error.response.data?.code === 'CONCURRENT_SESSION';
          
          if (isConcurrent) {
             // Expulsión forzosa por seguridad concurrente
             setUser(null);
             window.location.href = '/login?reason=concurrent';
          } else if (user) {
             // Sesión expirada normal
             setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [user]);

  const checkSession = useCallback(async (signal) => {
    try {
      const res = await axios.get('/api/session-info', { ...(signal && { signal }) });
      if (signal && signal.aborted) return;
      if (res.data && res.data.userId) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (axios.isCancel(err) || (signal && signal.aborted)) return;
      setUser(null);
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    checkSession(controller.signal);
    return () => controller.abort();
  }, [checkSession]);

  const login = useCallback(async (identificador, password, rol, force = false) => {
    try {
      const res = await axios.post('/api/login', { login: identificador, password, rol, force });
      if (res.data.success) {
        await checkSession();
      } else {
        throw new Error(res.data.error || 'Error de inicio de sesión');
      }
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.code === 'SESSION_ACTIVE') {
        const sessionError = new Error(apiError.error);
        sessionError.code = 'SESSION_ACTIVE';
        throw sessionError;
      }
      throw new Error(apiError?.error || err.message || 'Error de conexión');
    }
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout, loading }), [user, login, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
