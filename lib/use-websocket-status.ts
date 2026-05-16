import { useState, useEffect, useRef } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Estado global compartilhado da conexão WebSocket
let globalWsStatus: WebSocketStatus = 'connecting';
let statusListeners: Set<(status: WebSocketStatus) => void> = new Set();

/**
 * Atualiza o status global do WebSocket
 */
export function updateGlobalWebSocketStatus(status: WebSocketStatus) {
  if (globalWsStatus !== status) {
    globalWsStatus = status;
    statusListeners.forEach(listener => listener(status));
    console.log(`🔌 Status WebSocket atualizado: ${status}`);
  }
}

/**
 * Hook para monitorar o status da conexão WebSocket
 * Usa o estado compartilhado da conexão real, não testa conexões
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus>(globalWsStatus);

  useEffect(() => {
    // Adicionar listener para mudanças de status
    const listener = (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
    };

    statusListeners.add(listener);

    // Sincronizar estado atual
    setStatus(globalWsStatus);

    return () => {
      statusListeners.delete(listener);
    };
  }, []);

  return status;
}
