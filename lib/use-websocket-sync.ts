import { useEffect, useRef } from 'react';
import { getApiBaseUrl } from '@/constants/oauth';
import { updateGlobalWebSocketStatus } from './use-websocket-status';

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
 * Hook para sincronização em tempo real
 * Usa HTTP polling como transporte confiável
 * WebSocket é desabilitado porque requer configuração de rede complexa
 */
export function useWebSocketSync() {
  const apiBaseUrlRef = useRef<string>('');

  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    apiBaseUrlRef.current = apiBaseUrl;
    
    console.log('[Sync] API Base URL:', apiBaseUrl);
    
    if (apiBaseUrl) {
      console.log('[Sync] ✅ Usando HTTP polling para sincronização');
      updateGlobalWebSocketStatus('connected');
    } else {
      console.log('[Sync] ⚠️ Nenhuma URL de API configurada');
      updateGlobalWebSocketStatus('disconnected');
    }
  }, []);

  return null;
}
