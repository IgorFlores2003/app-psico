import React, { createContext, useCallback, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'paciente' | 'psicologo';
}

interface AuthState {
  token: string;
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn(credentials: SignInCredentials): Promise<User>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@AppPsico:token');
    const user = localStorage.getItem('@AppPsico:user');

    if (token && user) {
      // Set default header for all API calls
      api.defaults.headers.authorization = `Bearer ${token}`;
      return { token, user: JSON.parse(user) };
    }

    return {} as AuthState;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    const response = await api.post('/login', { email, password });

    const { token, user } = response.data;

    localStorage.setItem('@AppPsico:token', token);
    localStorage.setItem('@AppPsico:user', JSON.stringify(user));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, user });

    return user;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('@AppPsico:token');
    localStorage.removeItem('@AppPsico:user');

    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ user: data.user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
