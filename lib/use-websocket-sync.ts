import { useEffect, useRef, useCallback } from 'react';
import { getApiBaseUrl } from '@/constants/oauth';
import { updateGlobalWebSocketStatus } from './use-websocket-status';

interface SyncMessage {
  type: 'sync' | 'update' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'connected';
  dataType?: string;
  data?: any;
  timestamp?: number;
  clientId?: string;
}

// Callbacks para atualizar dados (será registrado pelo AppProvider)
let updateCallbacks: {
  members?: (data: any) => void;
  meetings?: (data: any) => void;
  events?: (data: any) => void;
  visitors?: (data: any) => void;
  visitas?: (data: any) => void;
  visitasComuns?: (data: any) => void;
  atas?: (data: any) => void;
  versinhos?: (data: any) => void;
} = {};

/**
 * Registra callbacks para sincronização WebSocket
 */
export function registerWebSocketCallbacks(callbacks: typeof updateCallbacks) {
  updateCallbacks = callbacks;
}

/**
 * Hook para sincronização em tempo real via WebSocket
 * Conecta ao servidor WebSocket e sincroniza todos os dados automaticamente
 */
export function useWebSocketSync() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientIdRef = useRef<string>('');

  // Atualizar dados através dos callbacks registrados
  const updateData = useCallback(
    (dataType: string, data: any) => {
      const callback = updateCallbacks[dataType as keyof typeof updateCallbacks];
      if (callback) {
        callback(data);
      }
    },
    []
  );

  // Inscrever em todos os tipos de dados
  const subscribeToAll = useCallback(() => {
    const dataTypes = [
      'members',
      'meetings',
      'events',
      'visitors',
      'visitas',
      'visitasComuns',
      'atas',
      'versinhos',
    ];

    dataTypes.forEach((dataType) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'subscribe',
            dataType,
            timestamp: Date.now(),
          })
        );
      }
    });
  }, []);

  // Processar mensagens recebidas
  const handleMessage = useCallback(
    (msg: SyncMessage) => {
      switch (msg.type) {
        case 'connected':
          console.log('🔌 Cliente ID:', msg.clientId);
          clientIdRef.current = msg.clientId || '';
          // Se conectou, inscrever em todos os tipos de dados
          subscribeToAll();
          break;

        case 'sync':
        case 'update':
          // Atualizar dados baseado no tipo
          if (msg.dataType && msg.data) {
            console.log(`📡 Sincronizando ${msg.dataType}:`, msg.data);
            updateData(msg.dataType, msg.data);
          }
          break;

        case 'ping':
          // Responder com pong
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
          break;

        default:
          console.log('⚠️ Tipo de mensagem desconhecido:', msg.type);
      }
    },
    [updateData, subscribeToAll]
  );

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    try {
      // Construir URL do WebSocket usando a mesma estratégia da API HTTP
      const apiBaseUrl = getApiBaseUrl();
      let wsUrl = '';
      
      console.log('[WS] apiBaseUrl:', apiBaseUrl);
      
      if (apiBaseUrl) {
        // Converter URL HTTP para WebSocket
        wsUrl = apiBaseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/ws';
      } else {
        // Fallback para localhost (desenvolvimento local)
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//localhost:3000/ws`;
        console.log('[WS] Usando fallback localhost');
      }

      console.log('[WS] 🔌 Conectando ao WebSocket:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] ✅ WebSocket conectado!');
        updateGlobalWebSocketStatus('connected');
      };

      wsRef.current.onmessage = (event: MessageEvent) => {
        try {
          const msg: SyncMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onerror = (error: Event) => {
        console.error('[WS] ❌ Erro WebSocket:', error);
        console.error('[WS] readyState:', wsRef.current?.readyState);
        updateGlobalWebSocketStatus('disconnected');
      };

      wsRef.current.onclose = () => {
        console.log('[WS] ⚠️ WebSocket desconectado. Tentando reconectar...');
        updateGlobalWebSocketStatus('reconnecting');
        // Reconectar após 3 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] Tentando reconectar...');
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('[WS] ❌ Erro ao conectar WebSocket:', error);
    }
  }, [handleMessage]);

  // Enviar atualização para o servidor
  const sendUpdate = useCallback((dataType: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update',
          dataType,
          data,
          timestamp: Date.now(),
        })
      );
    }
  }, []);

  // Conectar ao montar o componente
  useEffect(() => {
    updateGlobalWebSocketStatus('connecting');
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { sendUpdate, isConnected: (wsRef.current?.readyState === WebSocket.OPEN) || false };
}
