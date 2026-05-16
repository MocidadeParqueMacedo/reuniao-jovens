import { useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import { SyncQueue, QueuedAction } from './sync-queue';

/**
 * Hook para gerenciar sincronização de ações offline
 */
export function useOfflineSync(onSync?: (actions: QueuedAction[]) => Promise<void>) {
  const { isOnline } = useNetworkStatus();
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  // Sincronizar fila quando voltar online
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncingRef.current || !SyncQueue.hasPending()) {
      return;
    }

    isSyncingRef.current = true;
    console.log('🔄 Iniciando sincronização da fila...');

    try {
      const actions = SyncQueue.getAll();

      if (onSync) {
        await onSync(actions);
      }

      // Remover ações sincronizadas com sucesso
      for (const action of actions) {
        await SyncQueue.remove(action.id);
      }

      console.log(`✅ ${actions.length} ações sincronizadas com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar fila:', error);
      // Incrementar tentativas para ações que falharam
      const actions = SyncQueue.getAll();
      for (const action of actions) {
        await SyncQueue.incrementRetry(action.id);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, onSync]);

  // Carregar fila ao montar
  useEffect(() => {
    SyncQueue.load();
  }, []);

  // Sincronizar quando voltar online
  useEffect(() => {
    if (isOnline && SyncQueue.hasPending()) {
      console.log('📡 Voltou online, sincronizando fila...');
      // Aguardar um pouco antes de sincronizar
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncQueue();
      }, 1000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, syncQueue]);

  return {
    hasPending: SyncQueue.hasPending(),
    pendingCount: SyncQueue.size(),
    syncNow: syncQueue,
  };
}
