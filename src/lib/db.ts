// Database abstraction layer
import { supabase } from '@/integrations/supabase/client';
import { LocalStorageAdapter, isUsingLocalStorage } from './storage';

class DatabaseClient {
  from(table: string): any {
    if (isUsingLocalStorage()) {
      return new LocalStorageAdapter(table);
    }
    return (supabase as any).from(table);
  }

  get auth() {
    if (isUsingLocalStorage()) {
      // Mock auth for localStorage mode
      return {
        getSession: async () => ({ 
          data: { 
            session: {
              user: {
                id: 'local-user-id',
                email: 'dev@local.com',
                user_metadata: { nome: 'Usuário Local' }
              }
            } 
          } 
        }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async ({ email, password }: any) => ({ 
          data: { user: { id: 'local-user-id', email } }, 
          error: null 
        }),
        signInWithPassword: async ({ email, password }: any) => ({ 
          data: { user: { id: 'local-user-id', email } }, 
          error: null 
        }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({
          data: {
            user: {
              id: 'local-user-id',
              email: 'dev@local.com',
              user_metadata: { nome: 'Usuário Local' }
            }
          }
        })
      };
    }
    return supabase.auth;
  }
}

export const db = new DatabaseClient();
