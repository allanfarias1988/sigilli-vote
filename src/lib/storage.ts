// Storage abstraction layer - use localStorage in dev, Supabase in production
const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

interface StorageData {
  tenants: any[];
  profiles: any[];
  user_roles: any[];
  members: any[];
  surveys: any[];
  survey_items: any[];
  survey_votes: any[];
  commissions: any[];
  commission_roles: any[];
  ballots: any[];
  votes: any[];
}

const STORAGE_KEY = 'signa_data';

// Initialize localStorage with default data structure and mock data
const initLocalStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const tenantId = 'tenant-mock-001';
    const userId = 'local-user-id';
    const currentYear = new Date().getFullYear();

    // Create mock members
    const members = [
      { id: 'member-1', tenant_id: tenantId, nome_completo: 'João Silva', apelido: 'João', email: 'joao@example.com', telefone: '(11) 98765-4321', data_nasc: '1980-05-15', ano_batismo: 2005, apto: true, cargos_atuais: ['Ancião'], estado_civil: 'Casado', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-2', tenant_id: tenantId, nome_completo: 'Maria Santos', apelido: 'Maria', email: 'maria@example.com', telefone: '(11) 98765-4322', data_nasc: '1985-08-22', ano_batismo: 2008, apto: true, cargos_atuais: ['Diaconisa'], estado_civil: 'Casada', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-3', tenant_id: tenantId, nome_completo: 'Pedro Oliveira', apelido: 'Pedro', email: 'pedro@example.com', telefone: '(11) 98765-4323', data_nasc: '1975-03-10', ano_batismo: 2000, apto: true, cargos_atuais: ['Diácono'], estado_civil: 'Casado', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-4', tenant_id: tenantId, nome_completo: 'Ana Costa', apelido: 'Ana', email: 'ana@example.com', telefone: '(11) 98765-4324', data_nasc: '1990-11-05', ano_batismo: 2012, apto: true, cargos_atuais: [], estado_civil: 'Solteira', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-5', tenant_id: tenantId, nome_completo: 'Carlos Ferreira', apelido: 'Carlos', email: 'carlos@example.com', telefone: '(11) 98765-4325', data_nasc: '1988-07-18', ano_batismo: 2010, apto: true, cargos_atuais: ['Tesoureiro'], estado_civil: 'Casado', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-6', tenant_id: tenantId, nome_completo: 'Luciana Almeida', apelido: 'Luciana', email: 'luciana@example.com', telefone: '(11) 98765-4326', data_nasc: '1992-02-28', ano_batismo: 2015, apto: true, cargos_atuais: ['Secretária'], estado_civil: 'Solteira', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-7', tenant_id: tenantId, nome_completo: 'Ricardo Souza', apelido: 'Ricardo', email: 'ricardo@example.com', telefone: '(11) 98765-4327', data_nasc: '1983-09-12', ano_batismo: 2007, apto: true, cargos_atuais: [], estado_civil: 'Casado', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'member-8', tenant_id: tenantId, nome_completo: 'Fernanda Lima', apelido: 'Fernanda', email: 'fernanda@example.com', telefone: '(11) 98765-4328', data_nasc: '1995-04-20', ano_batismo: 2018, apto: true, cargos_atuais: [], estado_civil: 'Solteira', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    // Create mock surveys
    const survey1Id = 'survey-1';
    const surveys = [
      { id: survey1Id, tenant_id: tenantId, titulo: 'Pesquisa de Cargos 2025', descricao: 'Pesquisa para sugestão de cargos para o ano de 2025', ano: currentYear, status: 'aberta', link_code: 'PESQ2025', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'survey-2', tenant_id: tenantId, titulo: 'Pesquisa de Liderança', descricao: 'Sugestões para liderança da igreja', ano: currentYear, status: 'fechada', link_code: 'LID2024', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    const survey_items = [
      { id: 'si-1', survey_id: survey1Id, cargo_nome: 'Ancião', max_sugestoes: 3, ordem: 1, created_at: new Date().toISOString() },
      { id: 'si-2', survey_id: survey1Id, cargo_nome: 'Diácono', max_sugestoes: 3, ordem: 2, created_at: new Date().toISOString() },
      { id: 'si-3', survey_id: survey1Id, cargo_nome: 'Tesoureiro', max_sugestoes: 2, ordem: 3, created_at: new Date().toISOString() },
      { id: 'si-4', survey_id: survey1Id, cargo_nome: 'Secretário', max_sugestoes: 2, ordem: 4, created_at: new Date().toISOString() }
    ];

    // Create mock commissions
    const commission1Id = 'commission-1';
    const commissions = [
      { id: commission1Id, tenant_id: tenantId, nome: 'Comissão de Nomeações 2025', descricao: 'Votação oficial para cargos de 2025', ano: currentYear, status: 'aberta', link_code: 'COM2025', anonimato_modo: 'anonimo', created_at: new Date().toISOString(), finalized_at: null },
      { id: 'commission-2', tenant_id: tenantId, nome: 'Comissão Especial', descricao: 'Votação especial', ano: currentYear, status: 'draft', link_code: 'COMESP', anonimato_modo: 'identificado', created_at: new Date().toISOString(), finalized_at: null }
    ];

    const commission_roles = [
      { id: 'cr-1', commission_id: commission1Id, nome_cargo: 'Ancião', max_selecoes: 2, ordem: 1, ativo: true, created_at: new Date().toISOString() },
      { id: 'cr-2', commission_id: commission1Id, nome_cargo: 'Diácono', max_selecoes: 2, ordem: 2, ativo: true, created_at: new Date().toISOString() },
      { id: 'cr-3', commission_id: commission1Id, nome_cargo: 'Tesoureiro', max_selecoes: 1, ordem: 3, ativo: true, created_at: new Date().toISOString() }
    ];

    const defaultData: StorageData = {
      tenants: [
        { 
          id: tenantId, 
          nome: 'Igreja Adventista Central', 
          slug: 'igreja-adventista-central', 
          ano_corrente: currentYear,
          timezone: 'America/Sao_Paulo',
          created_at: new Date().toISOString() 
        }
      ],
      profiles: [
        { 
          id: userId, 
          tenant_id: tenantId, 
          nome: 'Usuário de Teste', 
          email: 'dev@local.com',
          telefone: '(11) 99999-9999',
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        }
      ],
      user_roles: [
        { 
          id: 'role-1', 
          user_id: userId, 
          tenant_id: tenantId, 
          role: 'tenant_admin', 
          created_at: new Date().toISOString() 
        }
      ],
      members,
      surveys,
      survey_items,
      survey_votes: [],
      commissions,
      commission_roles,
      ballots: [],
      votes: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  }
};

const getLocalData = (): StorageData => {
  initLocalStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
};

const setLocalData = (data: StorageData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Generate unique ID for localStorage
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Storage adapter for localStorage with chainable methods
export class LocalStorageAdapter {
  table: string;
  filters: any[] = [];
  orderByField: string | null = null;
  orderDirection: 'asc' | 'desc' = 'asc';
  limitCount: number | null = null;
  selectFields: string = '*';
  countMode: boolean = false;
  headMode: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.selectFields = columns;
    if (options?.count === 'exact') {
      this.countMode = true;
    }
    if (options?.head) {
      this.headMode = true;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByField = column;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async then(resolve: any) {
    const result = await this.executeQuery();
    resolve(result);
  }

  private async executeQuery() {
    const data = getLocalData();
    let records = [...(data[this.table as keyof StorageData] || [])];

    // Apply filters
    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        records = records.filter(record => record[filter.column] === filter.value);
      }
    });

    // Apply ordering
    if (this.orderByField) {
      records.sort((a, b) => {
        const aVal = a[this.orderByField!];
        const bVal = b[this.orderByField!];
        if (this.orderDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // Apply limit
    if (this.limitCount) {
      records = records.slice(0, this.limitCount);
    }

    // Return count if requested
    if (this.countMode) {
      return { count: records.length, error: null };
    }

    // Return head mode (no data, just count)
    if (this.headMode) {
      return { count: records.length, error: null };
    }

    return { data: records, error: null };
  }

  async single() {
    const result = await this.executeQuery();
    if ('data' in result) {
      return { data: result.data[0] || null, error: result.error };
    }
    return { data: null, error: null };
  }

  async maybeSingle() {
    return this.single();
  }

  insert(values: any | any[]) {
    const data = getLocalData();
    const records = Array.isArray(values) ? values : [values];
    
    const newRecords = records.map(record => ({
      ...record,
      id: record.id || generateId(),
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString()
    }));

    data[this.table as keyof StorageData] = [
      ...(data[this.table as keyof StorageData] || []),
      ...newRecords
    ];

    setLocalData(data);
    
    return {
      data: Array.isArray(values) ? newRecords : newRecords[0],
      error: null,
      select: () => ({
        data: newRecords,
        error: null,
        single: () => Promise.resolve({ data: newRecords[0], error: null })
      })
    };
  }

  update(values: any) {
    const data = getLocalData();
    let records = data[this.table as keyof StorageData] || [];

    // Apply filters to find records to update
    let recordsToUpdate = [...records];
    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        recordsToUpdate = recordsToUpdate.filter(record => record[filter.column] === filter.value);
      }
    });

    // Update matching records
    records = records.map(record => {
      if (recordsToUpdate.some(r => r.id === record.id)) {
        return {
          ...record,
          ...values,
          updated_at: new Date().toISOString()
        };
      }
      return record;
    });

    data[this.table as keyof StorageData] = records;
    setLocalData(data);

    return {
      data: recordsToUpdate.map(r => ({ ...r, ...values })),
      error: null
    };
  }

  delete() {
    const data = getLocalData();
    let records = data[this.table as keyof StorageData] || [];

    // Apply filters to find records to delete
    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        records = records.filter(record => record[filter.column] !== filter.value);
      }
    });

    data[this.table as keyof StorageData] = records;
    setLocalData(data);

    return Promise.resolve({ error: null });
  }
}

export const isUsingLocalStorage = () => USE_LOCAL_STORAGE;

// Export helper to check storage mode
export const getStorageMode = () => {
  return USE_LOCAL_STORAGE ? 'localStorage' : 'supabase';
};
