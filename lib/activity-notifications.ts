import { ActivityHistory } from './activity-history';
import { CriticalNotifications } from './critical-notifications';

/**
 * Sistema de notificações de atividade em tempo real
 */

export interface ActivityNotification {
  id: string;
  type: 'member_added' | 'member_updated' | 'member_deleted' | 'event_created' | 'presence_marked' | 'ata_created' | 'versinho_added';
  message: string;
  userName: string;
  timestamp: number;
  dataType: string;
}

// Callbacks para notificações
let activityCallbacks: ((notification: ActivityNotification) => void)[] = [];

/**
 * Registra callback para receber notificações de atividade
 */
export function registerActivityCallback(callback: (notification: ActivityNotification) => void) {
  activityCallbacks.push(callback);
}

/**
 * Remove callback de notificações
 */
export function unregisterActivityCallback(callback: (notification: ActivityNotification) => void) {
  activityCallbacks = activityCallbacks.filter((cb) => cb !== callback);
}

/**
 * Emite notificação de atividade
 */
export function emitActivityNotification(notification: ActivityNotification) {
  console.log('📢 Atividade:', notification.message);
  
  // Adicionar ao histórico
  ActivityHistory.add({
    type: notification.type,
    message: notification.message,
    userName: notification.userName,
    dataType: notification.dataType,
    timestamp: notification.timestamp,
  });
  
  // Enviar notificação push se for atividade crítica
  CriticalNotifications.sendNotification(notification);
  
  activityCallbacks.forEach((callback) => {
    try {
      callback(notification);
    } catch (error) {
      console.error('Erro ao chamar callback de atividade:', error);
    }
  });
}

/**
 * Cria notificação de membro adicionado
 */
export function createMemberAddedNotification(memberName: string, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'member_added',
    message: `${userName} adicionou ${memberName} como novo membro`,
    userName,
    timestamp: Date.now(),
    dataType: 'members',
  };
}

/**
 * Cria notificação de membro atualizado
 */
export function createMemberUpdatedNotification(memberName: string, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'member_updated',
    message: `${userName} atualizou informações de ${memberName}`,
    userName,
    timestamp: Date.now(),
    dataType: 'members',
  };
}

/**
 * Cria notificação de membro deletado
 */
export function createMemberDeletedNotification(memberName: string, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'member_deleted',
    message: `${userName} removeu ${memberName} da lista de membros`,
    userName,
    timestamp: Date.now(),
    dataType: 'members',
  };
}

/**
 * Cria notificação de evento criado
 */
export function createEventCreatedNotification(eventTitle: string, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'event_created',
    message: `${userName} criou o evento "${eventTitle}"`,
    userName,
    timestamp: Date.now(),
    dataType: 'events',
  };
}

/**
 * Cria notificação de presença marcada
 */
export function createPresenceMarkedNotification(memberCount: number, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'presence_marked',
    message: `${userName} marcou presença para ${memberCount} ${memberCount === 1 ? 'membro' : 'membros'}`,
    userName,
    timestamp: Date.now(),
    dataType: 'meetings',
  };
}

/**
 * Cria notificação de ata criada
 */
export function createAtaCreatedNotification(ataTitle: string, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'ata_created',
    message: `${userName} criou a ata "${ataTitle}"`,
    userName,
    timestamp: Date.now(),
    dataType: 'atas',
  };
}

/**
 * Cria notificação de versinho adicionado
 */
export function createVersinhoAddedNotification(versinhoTitle: string, userName: string): ActivityNotification {
  return {
    id: `activity_${Date.now()}_${Math.random()}`,
    type: 'versinho_added',
    message: `${userName} adicionou o versinho "${versinhoTitle}"`,
    userName,
    timestamp: Date.now(),
    dataType: 'versinhos',
  };
}
