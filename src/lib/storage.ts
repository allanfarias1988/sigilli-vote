// Storage abstraction layer - use localStorage in dev, Supabase in production
const USE_LOCAL_STORAGE = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true';

interface StorageData {
  tenants: any[];
  profiles: any[];
  user_roles: any[];
  members: any[];
  surveys: any[];
  survey_items: any[];
  commissions: any[];
  commission_roles: any[];
  ballots: any[];
  votes: any[];
}

const STORAGE_KEY = 'signa_data';

// Initialize localStorage with default data structure
const initLocalStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const defaultData: StorageData = {
      tenants: [],
      profiles: [],
      user_roles: [],
      members: [],
      surveys: [],
      survey_items: [],
      commissions: [],
      commission_roles: [],
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

// Storage adapter for localStorage
export class LocalStorageAdapter {
  table: string;

  constructor(table: string) {
    this.table = table;
  }

  async select(columns = '*', filters: any = {}) {
    const data = getLocalData();
    let records = [...(data[this.table as keyof StorageData] || [])];

    // Apply filters
    Object.keys(filters).forEach(key => {
      records = records.filter(record => record[key] === filters[key]);
    });

    return { data: records, error: null };
  }

  async insert(values: any | any[]) {
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
      error: null 
    };
  }

  async update(id: string, values: any) {
    const data = getLocalData();
    const records = data[this.table as keyof StorageData] || [];
    const index = records.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return { data: null, error: new Error('Record not found') };
    }

    records[index] = {
      ...records[index],
      ...values,
      updated_at: new Date().toISOString()
    };

    data[this.table as keyof StorageData] = records;
    setLocalData(data);

    return { data: records[index], error: null };
  }

  async delete(id: string) {
    const data = getLocalData();
    const records = data[this.table as keyof StorageData] || [];
    const filteredRecords = records.filter((r: any) => r.id !== id);

    data[this.table as keyof StorageData] = filteredRecords;
    setLocalData(data);

    return { error: null };
  }

  eq(column: string, value: any) {
    return this.select('*', { [column]: value });
  }

  single() {
    return this;
  }

  maybeSingle() {
    return this;
  }
}

export const isUsingLocalStorage = () => USE_LOCAL_STORAGE;

// Export helper to check storage mode
export const getStorageMode = () => {
  return USE_LOCAL_STORAGE ? 'localStorage' : 'supabase';
};
