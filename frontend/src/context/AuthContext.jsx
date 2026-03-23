import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Ensure all requests send the session cookie through the Vite proxy
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await axios.get('/api/session-info');
      if (res.data && res.data.userId) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identificador, password, rol) => {
    try {
      const res = await axios.post('/login', { login: identificador, password, rol });
      if (res.data.success) {
        await checkSession();
      } else {
        throw new Error(res.data.error || 'Error de inicio de sesión');
      }
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message || 'Error de conexión');
    }
  };

  const logout = async () => {
    try {
      await axios.get('/logout');
      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
