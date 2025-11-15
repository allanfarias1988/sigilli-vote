// src/lib/db.ts

/**
 * @description
 * Este arquivo atua como um "barril" de exportação para o cliente do banco de dados.
 * Ele verifica a variável de ambiente VITE_DATA_SOURCE para decidir qual
 * implementação do serviço de dados deve ser exposta para o restante da aplicação.
 *
 * - Se VITE_DATA_SOURCE === 'local', ele exporta o cliente simulado (localStorage).
 * - Caso contrário, ele exporta o cliente real do Supabase.
 *
 * Isso permite alternar entre desenvolvimento local offline e produção/staging
 * simplesmente alterando uma variável de ambiente, sem precisar refatorar
 * nenhuma chamada ao banco de dados na aplicação.
 */

// Importa o cliente Supabase original
import { supabase } from "@/integrations/supabase/client";

// Importa nosso cliente local simulado
import { db as localStorageDB } from "@/integrations/localStorage/client";

const isLocal = import.meta.env.VITE_DATA_SOURCE === "local";

console.log(`[DB Provider] Usando: ${isLocal ? "LocalStorage" : "Supabase"}`);

// A variável 'db' será o nosso cliente padrão para toda a aplicação.
// Se estivermos em modo local, ela usa a implementação do localStorage.
// Se não, ela usa o cliente Supabase.
export const db = isLocal ? localStorageDB : supabase;

// Também exportamos o cliente Supabase original com seu nome 'supabase'.
// Isso é importante porque a lógica de autenticação (useAuth.tsx) provavelmente depende
// de métodos específicos do objeto Supabase (como supabase.auth.onAuthStateChange)
// que nosso cliente local não simula.
export { supabase };
