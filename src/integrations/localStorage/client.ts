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
  profiles: TableRow<"profiles">[];
  members: TableRow<"members">[];
  commissions: TableRow<"commissions">[];
  commission_roles: TableRow<"commission_roles">[];
  ballots: TableRow<"ballots">[];
  votes: TableRow<"votes">[];
  surveys: TableRow<"surveys">[];
  survey_items: TableRow<"survey_items">[];
  survey_votes: TableRow<"survey_votes">[];
  user_roles: TableRow<"user_roles">[];
  short_links: TableRow<"short_links">[];
  audit_log: TableRow<"audit_log">[];
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
        nome: "Igreja Adventista Central",
        slug: "iasd-central",
        timezone: "America/Sao_Paulo",
        created_at: new Date().toISOString(),
        ano_corrente: new Date().getFullYear(),
        logo_url: null,
      },
    ],
    profiles: [],
    user_roles: [],
    short_links: [],
    audit_log: [],
    members: [
      {
        id: "mem-001",
        tenant_id: defaultTenantId,
        nome_completo: "João da Silva",
        apelido: "João",
        email: "joao.silva@example.com",
        telefone: "11999990001",
        data_nasc: "1980-01-15",
        ano_batismo: 2000,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: "https://i.pravatar.cc/150?u=mem-001",
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-002",
        tenant_id: defaultTenantId,
        nome_completo: "Maria Oliveira",
        apelido: "Maria",
        email: "maria.oliveira@example.com",
        telefone: "11999990002",
        data_nasc: "1992-05-20",
        ano_batismo: 2010,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: "https://i.pravatar.cc/150?u=mem-002",
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-003",
        tenant_id: defaultTenantId,
        nome_completo: "Carlos Pereira",
        apelido: "Carlos",
        email: "carlos.pereira@example.com",
        telefone: "11999990003",
        data_nasc: "1975-03-10",
        ano_batismo: 1995,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-004",
        tenant_id: defaultTenantId,
        nome_completo: "Ana Souza",
        apelido: "Ana",
        email: "ana.souza@example.com",
        telefone: "11999990004",
        data_nasc: "1988-11-25",
        ano_batismo: 2008,
        apto: false,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-005",
        tenant_id: defaultTenantId,
        nome_completo: "Pedro Santos",
        apelido: "Pedro",
        email: "pedro.santos@example.com",
        telefone: "11999990005",
        data_nasc: "1995-07-30",
        ano_batismo: 2015,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-006",
        tenant_id: defaultTenantId,
        nome_completo: "Juliana Costa",
        apelido: "Ju",
        email: "juliana.costa@example.com",
        telefone: "11999990006",
        data_nasc: "1982-09-05",
        ano_batismo: 2002,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-007",
        tenant_id: defaultTenantId,
        nome_completo: "Lucas Lima",
        apelido: "Lucas",
        email: "lucas.lima@example.com",
        telefone: "11999990007",
        data_nasc: "2000-02-20",
        ano_batismo: 2020,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-008",
        tenant_id: defaultTenantId,
        nome_completo: "Fernanda Martins",
        apelido: "Fê",
        email: "fernanda.martins@example.com",
        telefone: "11999990008",
        data_nasc: "1998-12-12",
        ano_batismo: 2018,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-009",
        tenant_id: defaultTenantId,
        nome_completo: "Ricardo Almeida",
        apelido: "Ricardo",
        email: "ricardo.almeida@example.com",
        telefone: "11999990009",
        data_nasc: "1970-06-18",
        ano_batismo: 1990,
        apto: true,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
      {
        id: "mem-010",
        tenant_id: defaultTenantId,
        nome_completo: "Camila Rodrigues",
        apelido: "Mila",
        email: "camila.rodrigues@example.com",
        telefone: "11999990010",
        data_nasc: "1993-04-22",
        ano_batismo: 2013,
        apto: false,
        created_at: new Date().toISOString(),
        imagem_url: null,
        cargos_atuais: [],
        endereco: null,
        estado_civil: null,
        interesses: [],
        tempo_no_cargo: null,
        updated_at: new Date().toISOString(),
      },
    ],
    commissions: [
      {
        id: defaultCommissionId,
        tenant_id: defaultTenantId,
        nome: "Comissão de Nomeações 2024",
        ano: 2024,
        descricao:
          "Comissão para nomear os oficiais da igreja para o próximo ano.",
        survey_id: null,
        anonimato_modo: "anonimo",
        status: "draft",
        link_code: "xyz123",
        created_by: null,
        created_at: new Date().toISOString(),
        finalized_at: null,
        finalization_key: null,
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
