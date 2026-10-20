import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthSession, AuthUser, UserRole, LoginCredentials, LoginResult, AuditEvent } from './authTypes';
import { loginUser, logoutUser, restorePersistedSession, getRecentAuditEvents, recordAuditEvent } from './authService';
import { hasRoutePermission } from './permissions';
import { AppRoute } from '../types';
import { DEV_USERS } from './devAuthProvider';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | undefined;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
  hasPermission: (route: AppRoute) => boolean;
  quickSwitchRole: (targetRole: UserRole) => Promise<void>;
  auditEvents: AuditEvent[];
  logAuditEvent: (action: AuditEvent['action'], metadata?: Record<string, unknown>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Restore session on initial load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const restored = restorePersistedSession();
        if (restored) {
          setSession(restored);
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error('Session restoration error:', err);
        setSession(null);
      } finally {
        // Small delay to prevent flash
        setTimeout(() => {
          setIsLoading(false);
          setAuditEvents(getRecentAuditEvents());
        }, 120);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const result = await loginUser(credentials);
    if (result.success && result.session) {
      setSession(result.session);
      setAuditEvents(getRecentAuditEvents());
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    const currentUser = session?.user;
    logoutUser(currentUser);
    setSession(null);
    setAuditEvents(getRecentAuditEvents());
  }, [session]);

  const hasPermission = useCallback(
    (route: AppRoute): boolean => {
      return hasRoutePermission(session?.user?.role, route);
    },
    [session]
  );

  const quickSwitchRole = useCallback(async (targetRole: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      ADMIN: 'admin@minevision.local',
      OFFICER: 'officer@minevision.local',
      OPERATOR: 'operator@minevision.local',
    };
    const targetEmail = emailMap[targetRole];
    const record = DEV_USERS[targetEmail];
    if (record) {
      await login({
        email: record.user.email,
        password: record.allowedPasswords[0],
      });
    }
  }, [login]);

  const logAuditEvent = useCallback(
    (action: AuditEvent['action'], metadata?: Record<string, unknown>) => {
      const current = session?.user;
      recordAuditEvent(
        action,
        current?.id || 'system',
        current?.email || 'system@minevision.local',
        metadata
      );
      setAuditEvents(getRecentAuditEvents());
    },
    [session]
  );

  const value: AuthContextType = {
    user: session?.user || null,
    role: session?.user?.role,
    session,
    isAuthenticated: !!session?.authenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    quickSwitchRole,
    auditEvents,
    logAuditEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
