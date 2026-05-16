import { useState, useEffect, useRef } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * Hook para monitorar o status da conexão WebSocket
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const statusRef = useRef<WebSocketStatus>('connecting');

  useEffect(() => {
    // Monitorar mudanças de conexão
    const checkConnection = setInterval(() => {
      try {
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
        const wsUrl = `${protocol}//${host}/ws`;

        // Tentar conectar para verificar status
        const testWs = new WebSocket(wsUrl);

        testWs.onopen = () => {
          if (statusRef.current !== 'connected') {
            statusRef.current = 'connected';
            setStatus('connected');
            console.log('✅ WebSocket conectado');
          }
          testWs.close();
        };

        testWs.onerror = () => {
          if (statusRef.current !== 'disconnected') {
            statusRef.current = 'disconnected';
            setStatus('disconnected');
            console.log('❌ WebSocket desconectado');
          }
        };

        testWs.onclose = () => {
          if (statusRef.current === 'connecting') {
            statusRef.current = 'disconnected';
            setStatus('disconnected');
          }
        };

        // Timeout de 5 segundos
        const timeout = setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING) {
            testWs.close();
            if (statusRef.current !== 'reconnecting') {
              statusRef.current = 'reconnecting';
              setStatus('reconnecting');
            }
          }
        }, 5000);

        return () => clearTimeout(timeout);
      } catch (error) {
        console.error('Erro ao verificar WebSocket:', error);
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(checkConnection);
  }, []);

  return status;
}
