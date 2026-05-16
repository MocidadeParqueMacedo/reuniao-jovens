import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Tipos para mensagens WebSocket
export interface SyncMessage {
  type: 'sync' | 'update' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  dataType?: string; // 'members' | 'meetings' | 'presenca' | 'visitas' | 'atas' | 'versinhos' | 'eventos' | 'users'
  data?: any;
  timestamp?: number;
  clientId?: string;
}

// Armazena clientes conectados
const connectedClients = new Map<string, WebSocket>();

// Armazena dados sincronizados em memória (cache)
const syncedData = new Map<string, any>();

/**
 * Inicializa o servidor WebSocket
 */
export function initializeWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = generateClientId();
    connectedClients.set(clientId, ws);

    console.log(`📡 Cliente conectado: ${clientId} (Total: ${connectedClients.size})`);

    // Enviar ID do cliente para o frontend
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    }));

    // Listener para mensagens do cliente
    ws.on('message', (message: string) => {
      try {
        const msg: SyncMessage = JSON.parse(message);
        handleMessage(clientId, msg, wss);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem WebSocket:', error);
      }
    });

    // Listener para desconexão
    ws.on('close', () => {
      connectedClients.delete(clientId);
      console.log(`📡 Cliente desconectado: ${clientId} (Total: ${connectedClients.size})`);
    });

    // Listener para erro
    ws.on('error', (error: Error) => {
      console.error(`❌ Erro WebSocket para ${clientId}:`, error);
    });

    // Keep-alive com ping/pong
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // A cada 30 segundos
  });

  console.log('✅ Servidor WebSocket inicializado em /ws');
  return wss as WebSocketServer;
}

/**
 * Processa mensagens recebidas dos clientes
 */
function handleMessage(clientId: string, msg: SyncMessage, wss: WebSocketServer) {
  switch (msg.type) {
    case 'ping':
      // Responder com pong
      const client = connectedClients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
      break;

    case 'subscribe':
      // Cliente quer receber atualizações de um tipo de dado
      if (msg.dataType) {
        console.log(`📡 ${clientId} inscrito em: ${msg.dataType}`);
        // Enviar dados atuais
        const data = syncedData.get(msg.dataType);
        if (data) {
          const client = connectedClients.get(clientId);
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'sync',
              dataType: msg.dataType,
              data,
              timestamp: Date.now(),
            }));
          }
        }
      }
      break;

    case 'update':
      // Cliente enviou uma atualização
      if (msg.dataType && msg.data) {
        console.log(`📡 Atualização recebida: ${msg.dataType}`);
        // Armazenar no cache
        syncedData.set(msg.dataType, msg.data);
        // Broadcast para todos os outros clientes
        broadcastUpdate(msg.dataType, msg.data, clientId, wss);
      }
      break;

    default:
      console.log(`⚠️ Tipo de mensagem desconhecido: ${msg.type}`);
  }
}

/**
 * Envia uma atualização para todos os clientes conectados
 */
export function broadcastUpdate(dataType: string, data: any, excludeClientId?: string, wss?: WebSocketServer) {
  // Armazenar no cache
  syncedData.set(dataType, data);

  // Enviar para todos os clientes
  connectedClients.forEach((client, clientId) => {
    // Não enviar de volta para quem enviou a atualização
    if (excludeClientId && clientId === excludeClientId) {
      return;
    }

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        dataType,
        data,
        timestamp: Date.now(),
      }));
    }
  });

  console.log(`📡 Broadcast enviado para ${connectedClients.size} clientes: ${dataType}`);
}

/**
 * Gera um ID único para o cliente
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Retorna o número de clientes conectados
 */
export function getConnectedClientsCount(): number {
  return connectedClients.size;
}
