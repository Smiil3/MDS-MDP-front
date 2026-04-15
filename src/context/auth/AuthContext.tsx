import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import * as authApi from '../../services/api/authApi';
import { setApiAuthHandlers } from '../../services/api/httpClient';
import { clearStoredSession, getStoredSession, saveSession } from '../../storage/secureStore';
import { AuthRole, AuthSuccessResponse, RegisterPayload, User } from '../../types/auth';

type Session = AuthSuccessResponse;

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: AuthRole, email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const applySession = useCallback(async (nextSession: Session) => {
    setSession(nextSession);
    await saveSession(
      { accessToken: nextSession.accessToken, refreshToken: nextSession.refreshToken },
      nextSession.user,
    );
  }, []);

  const clearSession = useCallback(async () => {
    setSession(null);
    await clearStoredSession();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedSession = await getStoredSession();
        if (!storedSession) {
          return;
        }

        const restoredSession: Session = {
          ...storedSession.tokens,
          user: storedSession.user,
        };
        sessionRef.current = restoredSession;
        setSession(restoredSession);

        await authApi.getCurrentUser(storedSession.user.role);
      } catch {
        await clearStoredSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    setApiAuthHandlers({
      getAccessToken: () => sessionRef.current?.accessToken ?? null,
      getRefreshToken: () => sessionRef.current?.refreshToken ?? null,
      onRefreshSuccess: async (data) => {
        setSession(data);
        await saveSession(
          { accessToken: data.accessToken, refreshToken: data.refreshToken },
          data.user,
        );
      },
      onAuthFailure: clearSession,
    });

    return () => {
      setApiAuthHandlers(null);
    };
  }, [clearSession]);

  const login = useCallback(async (role: AuthRole, email: string, password: string) => {
    const response = await authApi.login({ role, email, password });
    await applySession(response);
  }, [applySession]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    await applySession(response);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isLoading,
      login,
      register,
      logout: clearSession,
    }),
    [session, isLoading, login, register, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
