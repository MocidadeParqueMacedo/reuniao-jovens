import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActivityRecord {
  id: string;
  type: 'member_added' | 'member_updated' | 'member_deleted' | 'event_created' | 'presence_marked' | 'ata_created' | 'versinho_added';
  message: string;
  userName: string;
  dataType: string;
  timestamp: number;
  details?: Record<string, any>;
}

const HISTORY_KEY = '@activity_history';
const MAX_HISTORY_SIZE = 500; // Manter apenas os últimos 500 registros

/**
 * Gerencia histórico de atividades
 */
export class ActivityHistory {
  private static history: ActivityRecord[] = [];

  /**
   * Carrega histórico do armazenamento
   */
  static async load(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
        console.log(`📚 Histórico carregado: ${this.history.length} registros`);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }

  /**
   * Salva histórico no armazenamento
   */
  private static async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  /**
   * Adiciona registro ao histórico
   */
  static async add(record: Omit<ActivityRecord, 'id'>): Promise<void> {
    const newRecord: ActivityRecord = {
      ...record,
      id: `activity_${Date.now()}_${Math.random()}`,
    };

    this.history.unshift(newRecord); // Adicionar no início

    // Manter apenas os últimos MAX_HISTORY_SIZE registros
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(0, MAX_HISTORY_SIZE);
    }

    await this.save();
  }

  /**
   * Retorna todos os registros
   */
  static getAll(): ActivityRecord[] {
    return [...this.history];
  }

  /**
   * Retorna registros filtrados por tipo
   */
  static getByType(type: ActivityRecord['type']): ActivityRecord[] {
    return this.history.filter((record) => record.type === type);
  }

  /**
   * Retorna registros filtrados por usuário
   */
  static getByUser(userName: string): ActivityRecord[] {
    return this.history.filter((record) => record.userName === userName);
  }

  /**
   * Retorna registros filtrados por tipo de dado
   */
  static getByDataType(dataType: string): ActivityRecord[] {
    return this.history.filter((record) => record.dataType === dataType);
  }

  /**
   * Retorna registros de um período (últimas N horas)
   */
  static getRecent(hours: number = 24): ActivityRecord[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.history.filter((record) => record.timestamp > cutoff);
  }

  /**
   * Retorna registros com paginação
   */
  static getPaginated(page: number = 1, pageSize: number = 20): {
    records: ActivityRecord[];
    total: number;
    pages: number;
  } {
    const total = this.history.length;
    const pages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      records: this.history.slice(start, end),
      total,
      pages,
    };
  }

  /**
   * Limpa histórico
   */
  static async clear(): Promise<void> {
    this.history = [];
    await AsyncStorage.removeItem(HISTORY_KEY);
    console.log('🗑️ Histórico limpo');
  }

  /**
   * Retorna estatísticas do histórico
   */
  static getStats(): {
    total: number;
    byType: Record<string, number>;
    byUser: Record<string, number>;
    byDataType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byDataType: Record<string, number> = {};

    this.history.forEach((record) => {
      byType[record.type] = (byType[record.type] || 0) + 1;
      byUser[record.userName] = (byUser[record.userName] || 0) + 1;
      byDataType[record.dataType] = (byDataType[record.dataType] || 0) + 1;
    });

    return {
      total: this.history.length,
      byType,
      byUser,
      byDataType,
    };
  }
}
