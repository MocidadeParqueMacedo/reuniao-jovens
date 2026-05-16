import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedAction {
  id: string;
  type: 'update' | 'create' | 'delete';
  dataType: string;
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = '@sync_queue';
const MAX_RETRIES = 3;

/**
 * Gerencia fila de ações para sincronização offline
 */
export class SyncQueue {
  private static queue: QueuedAction[] = [];

  /**
   * Carrega fila do armazenamento
   */
  static async load(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📋 Fila carregada: ${this.queue.length} ações pendentes`);
      }
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  }

  /**
   * Salva fila no armazenamento
   */
  private static async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Erro ao salvar fila:', error);
    }
  }

  /**
   * Adiciona ação à fila
   */
  static async enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queuedAction: QueuedAction = {
      ...action,
      id: `queue_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedAction);
    console.log(`⏳ Ação enfileirada: ${action.type} ${action.dataType}`);
    await this.save();
  }

  /**
   * Retorna todas as ações da fila
   */
  static getAll(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Remove ação da fila após sincronização bem-sucedida
   */
  static async remove(id: string): Promise<void> {
    this.queue = this.queue.filter((action) => action.id !== id);
    await this.save();
    console.log(`✅ Ação removida da fila: ${id}`);
  }

  /**
   * Incrementa contador de tentativas
   */
  static async incrementRetry(id: string): Promise<boolean> {
    const action = this.queue.find((a) => a.id === id);
    if (!action) return false;

    action.retries++;
    if (action.retries > MAX_RETRIES) {
      // Remover ação após máximo de tentativas
      await this.remove(id);
      console.log(`❌ Ação removida após ${MAX_RETRIES} tentativas: ${id}`);
      return false;
    }

    await this.save();
    return true;
  }

  /**
   * Limpa toda a fila
   */
  static async clear(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('🗑️ Fila limpa');
  }

  /**
   * Retorna tamanho da fila
   */
  static size(): number {
    return this.queue.length;
  }

  /**
   * Verifica se há ações na fila
   */
  static hasPending(): boolean {
    return this.queue.length > 0;
  }
}
