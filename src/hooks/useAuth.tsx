// src/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/db"; // Usamos 'supabase' para as chamadas reais
import { db as localStorageDB } from "@/integrations/localStorage/client"; // Importamos o cliente local diretamente
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    nome: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isLocal = import.meta.env.VITE_DATA_SOURCE === "local";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLocal) {
      // Em modo local, verificamos se já existe uma sessão mockada no sessionStorage
      const mockSessionString = sessionStorage.getItem("signa-mock-session");
      if (mockSessionString) {
        const mockSession = JSON.parse(mockSessionString);
        setUser(mockSession.user);
        setSession(mockSession);
      }
      setLoading(false);
    } else {
      // Em modo Supabase, usamos o listener de autenticação real
      const getSession = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      };
      getSession();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // --- Funções de Autenticação Híbridas ---

  const signUp = async (email: string, password: string, nome: string) => {
    if (isLocal) {
      // LÓGICA LOCAL
      console.log("Executando signUp local...");
      // Em modo local, não temos tabela users, vamos criar o profile direto
      // Simula login automático após o cadastro
      await signIn(email, password);
      return { error: null };
    } else {
      // LÓGICA SUPABASE
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isLocal) {
      // LÓGICA LOCAL - Criar usuário mockado
      console.log("Executando signIn local...");
      
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        user_metadata: { nome: 'Usuário Local' },
      } as unknown as User;

      const mockSession = {
        user: mockUser,
        access_token: `mock-token-${Date.now()}`,
        refresh_token: `mock-refresh-${Date.now()}`,
      } as unknown as Session;

      sessionStorage.setItem("signa-mock-session", JSON.stringify(mockSession));
      setUser(mockUser);
      setSession(mockSession);

      navigate("/onboarding"); // Redireciona para onboarding
      return { error: null };
    } else {
      // LÓGICA SUPABASE
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) navigate("/dashboard");
      return { error };
    }
  };

  const signOut = async () => {
    if (isLocal) {
      // LÓGICA LOCAL
      console.log("Executando signOut local...");
      sessionStorage.removeItem("signa-mock-session");
      setUser(null);
      setSession(null);
    } else {
      // LÓGICA SUPABASE
      await supabase.auth.signOut();
    }
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
