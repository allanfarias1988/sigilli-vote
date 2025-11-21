// sigilli-vote/src/integrations/localStorage/client.ts

/**
 * @description
 * Este arquivo simula um cliente de banco de dados (como o Supabase) usando o localStorage do navegador.
 * Ele permite o desenvolvimento e teste da UI sem depender de uma conexão de backend.
 *
 * Funcionalidades:
 * - Persistência de dados entre recarregamentos da página.
 * - Estrutura de dados inspirada no modelo relacional do Supabase.
 * - Dados iniciais (mock) para um ambiente de desenvolvimento consistente.
 * - Interface fluente e encadeável para consultas (from, select, insert, etc.), imitando o supabase-js.
 */

import { Database } from "../supabase/types";

// Tipos auxiliares para o nosso DB local
type TableName = keyof Database["public"]["Tables"];
type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
type TableInsert<T extends TableName> =
  Database["public"]["Tables"][T]["Insert"];
type TableUpdate<T extends TableName> =
  Database["public"]["Tables"][T]["Update"];

// Estrutura completa do nosso banco de dados local
interface LocalDatabase {
  tenants: TableRow<"tenants">[];
  users: TableRow<"users">[];
  members: TableRow<"members">[];
  commissions: TableRow<"commissions">[];
  commission_roles: TableRow<"commission_roles">[];
  ballots: TableRow<"ballots">[];
  votes: TableRow<"votes">[];
  // NOVAS TABELAS ADICIONADAS PARA O MÓDULO DE PESQUISAS
  surveys: TableRow<"surveys">[];
  survey_items: TableRow<"survey_items">[];
  survey_votes: TableRow<"survey_votes">[];
}

const LOCAL_DB_KEY = "SIGNA_LOCAL_DB";

const getInitialMockData = (): LocalDatabase => {
  const defaultTenantId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
  const defaultCommissionId = "com-001";
  const defaultSurveyId = "sur-001";

  return {
    tenants: [
      {
        id: defaultTenantId,
        name: "Igreja Adventista Central",
        slug: "iasd-central",
        timezone: "America/Sao_Paulo",
        created_at: new Date().toISOString(),
      },
    ],
    users: [
      {
        id: "user-001",
        tenant_id: defaultTenantId,
        name: "Admin da Comissão",
        email: "admin@example.com",
        phone: "11987654321",
        role: "commission_admin",
        created_at: new Date().toISOString(),
      },
    ],
    members: [
      {
        id: "mem-001",
        tenant_id: defaultTenantId,
        full_name: "João da Silva",
        nickname: "João",
        email: "joao.silva@example.com",
        phone: "11999990001",
        birth_date: "1980-01-15",
        baptism_year: 2000,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: "https://i.pravatar.cc/150?u=mem-001",
      },
      {
        id: "mem-002",
        tenant_id: defaultTenantId,
        full_name: "Maria Oliveira",
        nickname: "Maria",
        email: "maria.oliveira@example.com",
        phone: "11999990002",
        birth_date: "1992-05-20",
        baptism_year: 2010,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: "https://i.pravatar.cc/150?u=mem-002",
      },
      {
        id: "mem-003",
        tenant_id: defaultTenantId,
        full_name: "Carlos Pereira",
        nickname: "Carlos",
        email: "carlos.pereira@example.com",
        phone: "11999990003",
        birth_date: "1975-03-10",
        baptism_year: 1995,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-004",
        tenant_id: defaultTenantId,
        full_name: "Ana Souza",
        nickname: "Ana",
        email: "ana.souza@example.com",
        phone: "11999990004",
        birth_date: "1988-11-25",
        baptism_year: 2008,
        is_active: false,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-005",
        tenant_id: defaultTenantId,
        full_name: "Pedro Santos",
        nickname: "Pedro",
        email: "pedro.santos@example.com",
        phone: "11999990005",
        birth_date: "1995-07-30",
        baptism_year: 2015,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-006",
        tenant_id: defaultTenantId,
        full_name: "Juliana Costa",
        nickname: "Ju",
        email: "juliana.costa@example.com",
        phone: "11999990006",
        birth_date: "1982-09-05",
        baptism_year: 2002,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-007",
        tenant_id: defaultTenantId,
        full_name: "Lucas Lima",
        nickname: "Lucas",
        email: "lucas.lima@example.com",
        phone: "11999990007",
        birth_date: "2000-02-20",
        baptism_year: 2020,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-008",
        tenant_id: defaultTenantId,
        full_name: "Fernanda Martins",
        nickname: "Fê",
        email: "fernanda.martins@example.com",
        phone: "11999990008",
        birth_date: "1998-12-12",
        baptism_year: 2018,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-009",
        tenant_id: defaultTenantId,
        full_name: "Ricardo Almeida",
        nickname: "Ricardo",
        email: "ricardo.almeida@example.com",
        phone: "11999990009",
        birth_date: "1970-06-18",
        baptism_year: 1990,
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
      {
        id: "mem-010",
        tenant_id: defaultTenantId,
        full_name: "Camila Rodrigues",
        nickname: "Mila",
        email: "camila.rodrigues@example.com",
        phone: "11999990010",
        birth_date: "1993-04-22",
        baptism_year: 2013,
        is_active: false,
        created_at: new Date().toISOString(),
        avatar_url: null,
      },
    ],
    commissions: [
      {
        id: defaultCommissionId,
        tenant_id: defaultTenantId,
        name: "Comissão de Nomeações 2024",
        year: 2024,
        description:
          "Comissão para nomear os oficiais da igreja para o próximo ano.",
        survey_id: null,
        anonimato_modo: "anonimo",
        status: "draft",
        link_code: "xyz123",
        created_by: "user-001",
        created_at: new Date().toISOString(),
        finalized_at: null,
      },
    ],
    commission_roles: [
      {
        id: "role-001",
        commission_id: defaultCommissionId,
        nome_cargo: "Primeiro Ancião",
        max_selecoes: 1,
        ordem: 1,
        ativo: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "role-002",
        commission_id: defaultCommissionId,
        nome_cargo: "Tesoureiro",
        max_selecoes: 1,
        ordem: 2,
        ativo: true,
        created_at: new Date().toISOString(),
      },
    ],
    ballots: [],
    votes: [],
    // DADOS MOCKADOS PARA PESQUISAS
    surveys: [
      {
        id: defaultSurveyId,
        tenant_id: defaultTenantId,
        titulo: "Sugestões para Líderes 2025",
        descricao: "Sugira nomes para os cargos da igreja no próximo ano.",
        status: "aberta", // 'aberta', 'fechada'
        link_code: "surv123",
        created_at: new Date().toISOString(),
        ano: 2025,
        updated_at: new Date().toISOString(),
      },
    ],
    survey_items: [
      {
        id: "item-001",
        survey_id: defaultSurveyId,
        cargo_nome: "Presidente",
        max_sugestoes: 2,
        ordem: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: "item-002",
        survey_id: defaultSurveyId,
        cargo_nome: "Tesoureiro",
        max_sugestoes: 1,
        ordem: 2,
        created_at: new Date().toISOString(),
      },
    ],
    survey_votes: [
      {
        id: "svote-001",
        survey_id: defaultSurveyId,
        member_id: "mem-001",
        cargo_nome: "Presidente",
        created_at: new Date().toISOString(),
        vote_count: 1,
      },
      {
        id: "svote-002",
        survey_id: defaultSurveyId,
        member_id: "mem-002",
        cargo_nome: "Presidente",
        created_at: new Date().toISOString(),
        vote_count: 1,
      },
    ],
  };
};

class LocalDBManager {
  private static instance: LocalDatabase;

  private constructor() { }

  public static getInstance(): LocalDatabase {
    if (!LocalDBManager.instance) {
      try {
        const storedData = window.localStorage.getItem(LOCAL_DB_KEY);
        if (storedData) {
          LocalDBManager.instance = JSON.parse(storedData);
        } else {
          console.log("Inicializando banco de dados local com dados mockados.");
          const initialData = getInitialMockData();
          window.localStorage.setItem(
            LOCAL_DB_KEY,
            JSON.stringify(initialData),
          );
          LocalDBManager.instance = initialData;
        }
      } catch (error) {
        console.error(
          "Falha ao ler ou inicializar o banco de dados local:",
          error,
        );
        LocalDBManager.instance = getInitialMockData();
      }
    }
    return LocalDBManager.instance;
  }

  public static saveChanges() {
    try {
      window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(this.instance));
    } catch (error) {
      console.error(
        "Falha ao salvar alterações no banco de dados local:",
        error,
      );
    }
  }
}

const dbInstance = LocalDBManager.getInstance();

type Filter = { column: string; value: any };

const from = <T extends TableName>(tableName: T) => {
  let filters: Filter[] = [];

  const applyFilters = (data: any[]) => {
    if (filters.length === 0) return data;
    return data.filter((row) =>
      filters.every((filter) => row[filter.column] === filter.value),
    );
  };

  const createQueryExecutor = (
    promise: Promise<{ data: any[] | null; error: Error | null }>,
  ) => {
    const executor = {
      then: (onfulfilled: any, onrejected: any) =>
        promise.then(onfulfilled, onrejected),
      single: () => {
        const singlePromise = promise.then((result) => {
          if (result.error) return result;
          if (result.data && result.data.length > 1) {
            return {
              data: null,
              error: new Error("A consulta retornou mais de uma linha."),
            };
          }
          return { data: result.data?.[0] || null, error: null };
        });
        return createQueryExecutor(singlePromise as any);
      },
    };
    return executor;
  };

  const queryBuilder = {
    eq: (column: string, value: any) => {
      filters.push({ column, value });
      return queryBuilder;
    },

    select: (columns: string = "*") => {
      const promise = new Promise<{ data: any[] | null; error: Error | null }>(
        (resolve) => {
          if (!dbInstance[tableName]) {
            return resolve({
              data: null,
              error: new Error(`Tabela "${tableName}" não encontrada.`),
            });
          }
          const allData = dbInstance[tableName] as any[];
          const filteredData = applyFilters(allData);
          resolve({ data: filteredData, error: null });
        },
      );
      return createQueryExecutor(promise);
    },

    insert: (newRecords: TableInsert<T> | TableInsert<T>[]) => {
      const promise = new Promise<{ data: any[] | null; error: Error | null }>(
        (resolve) => {
          if (!dbInstance[tableName]) {
            return resolve({
              data: null,
              error: new Error(`Tabela "${tableName}" não encontrada.`),
            });
          }
          const recordsToInsert = Array.isArray(newRecords)
            ? newRecords
            : [newRecords];
          const insertedData: TableRow<T>[] = [];

          for (const record of recordsToInsert) {
            const newRecord: TableRow<T> = {
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              ...record,
            } as unknown as TableRow<T>;
            (dbInstance[tableName] as any[]).push(newRecord);
            insertedData.push(newRecord);
          }
          LocalDBManager.saveChanges();
          resolve({ data: insertedData, error: null });
        },
      );

      const insertExecutor = {
        ...createQueryExecutor(promise),
        select: () => createQueryExecutor(promise),
      };
      return insertExecutor;
    },

    update: (updates: TableUpdate<T>) => {
      const promise = new Promise<{ data: any[] | null; error: Error | null }>(
        (resolve) => {
          if (!dbInstance[tableName]) {
            return resolve({
              data: null,
              error: new Error(`Tabela "${tableName}" não encontrada.`),
            });
          }
          const allData = dbInstance[tableName] as any[];
          const updatedData: TableRow<T>[] = [];
          const dataToUpdate = applyFilters(allData);

          for (const row of dataToUpdate) {
            const rowIndex = allData.findIndex((item) => item.id === row.id);
            if (rowIndex > -1) {
              const updatedRow = { ...allData[rowIndex], ...updates };
              allData[rowIndex] = updatedRow;
              updatedData.push(updatedRow);
            }
          }
          LocalDBManager.saveChanges();
          resolve({ data: updatedData, error: null });
        },
      );
      const updateExecutor = {
        ...createQueryExecutor(promise),
        select: () => createQueryExecutor(promise),
      };
      return updateExecutor;
    },

    delete: () => {
      const promise = new Promise<{ data: any[] | null; error: Error | null }>(
        (resolve) => {
          if (!dbInstance[tableName]) {
            return resolve({
              data: null,
              error: new Error(`Tabela "${tableName}" não encontrada.`),
            });
          }
          const allData = dbInstance[tableName] as any[];
          const deletedData = applyFilters(allData);
          const idsToDelete = new Set(deletedData.map((row) => row.id));

          (dbInstance as any)[tableName] = allData.filter(
            (row) => !idsToDelete.has(row.id),
          );
          LocalDBManager.saveChanges();
          resolve({ data: deletedData, error: null });
        },
      );
      const deleteExecutor = {
        ...createQueryExecutor(promise),
        select: () => createQueryExecutor(promise),
      };
      return deleteExecutor;
    },
  };

  return queryBuilder;
};

export const db = {
  from,
  channel: (name: string) => ({
    on: (event: string, config: any, callback: (payload: any) => void) => ({
      subscribe: () => {
        console.log(`[Mock Realtime] Subscribed to channel: ${name}`);
        return {
          unsubscribe: () => console.log(`[Mock Realtime] Unsubscribed from channel: ${name}`),
        };
      },
    }),
    subscribe: (callback?: (status: string) => void) => {
      console.log(`[Mock Realtime] Subscribed to channel: ${name}`);
      if (callback) callback("SUBSCRIBED");
      return {
        unsubscribe: () => console.log(`[Mock Realtime] Unsubscribed from channel: ${name}`),
      };
    },
  }),
  removeChannel: (channel: any) => {
    console.log("[Mock Realtime] Channel removed");
    if (channel && typeof channel.unsubscribe === "function") {
      channel.unsubscribe();
    }
  },
};
