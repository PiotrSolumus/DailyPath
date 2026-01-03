import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserMeDTO } from "../../types";

interface AuthContextValue {
  user: UserMeDTO | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: UserMeDTO | null }) {
  const [user, setUser] = useState<UserMeDTO | null>(initialUser ?? null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/users/me");

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialUser) {
      fetchUser();
    }
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, error, refetch: fetchUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

