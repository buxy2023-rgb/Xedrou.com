import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status && error.status !== 401 && error.status !== 403) {
        setAuthError({ type: 'unknown', message: error.message || 'Authentication service error' });
      } else {
        setAuthError(null);
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkAppState = useCallback(() => checkUserAuth(), [checkUserAuth]);

  useEffect(() => {
    checkUserAuth();
    const unsubscribe = base44.auth._onAuthStateChanged(() => {
      checkUserAuth();
    });
    return unsubscribe;
  }, [checkUserAuth]);

  const logout = (shouldRedirect = true, redirectTo = '/login') => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? redirectTo : undefined);
  };

  const navigateToLogin = () => {
    const returnTo = typeof window !== 'undefined' ? window.location.href : undefined;
    base44.auth.redirectToLogin(returnTo);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
