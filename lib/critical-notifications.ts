import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityNotification } from './activity-notifications';

const NOTIFICATION_PREFS_KEY = '@notification_preferences';

export interface NotificationPreferences {
  memberAdded: boolean;
  memberDeleted: boolean;
  presenceMarked: boolean;
  eventCreated: boolean;
  ataCreated: boolean;
  versinhoAdded: boolean;
  enabled: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  memberAdded: true,
  memberDeleted: true,
  presenceMarked: true,
  eventCreated: false,
  ataCreated: false,
  versinhoAdded: false,
  enabled: true,
};

/**
 * Serviço de notificações push para atividades críticas
 */
export class CriticalNotifications {
  private static prefs: NotificationPreferences = DEFAULT_PREFS;

  /**
   * Carrega preferências de notificação
   */
  static async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(stored) };
      } else {
        this.prefs = DEFAULT_PREFS;
      }
      console.log('📬 Preferências de notificação carregadas');
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      this.prefs = DEFAULT_PREFS;
    }
  }

  /**
   * Salva preferências de notificação
   */
  static async savePreferences(prefs: NotificationPreferences): Promise<void> {
    try {
      this.prefs = prefs;
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
      console.log('✅ Preferências de notificação salvas');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    }
  }

  /**
   * Retorna preferências atuais
   */
  static getPreferences(): NotificationPreferences {
    return { ...this.prefs };
  }

  /**
   * Verifica se deve enviar notificação para este tipo de atividade
   */
  static shouldNotify(activityType: ActivityNotification['type']): boolean {
    if (!this.prefs.enabled) return false;

    switch (activityType) {
      case 'member_added':
        return this.prefs.memberAdded;
      case 'member_deleted':
        return this.prefs.memberDeleted;
      case 'presence_marked':
        return this.prefs.presenceMarked;
      case 'event_created':
        return this.prefs.eventCreated;
      case 'ata_created':
        return this.prefs.ataCreated;
      case 'versinho_added':
        return this.prefs.versinhoAdded;
      default:
        return false;
    }
  }

  /**
   * Envia notificação push
   */
  static async sendNotification(activity: ActivityNotification): Promise<void> {
    if (!this.shouldNotify(activity.type)) {
      return;
    }

    try {
      const { title, body, icon } = this.getNotificationContent(activity);

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            activityId: activity.id,
            activityType: activity.type,
            userName: activity.userName,
          },
          badge: 1,
          sound: 'default',
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Enviar imediatamente
      });

      console.log(`📬 Notificação enviada: ${title}`);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  /**
   * Gera conteúdo da notificação baseado no tipo de atividade
   */
  private static getNotificationContent(
    activity: ActivityNotification
  ): { title: string; body: string; icon: string } {
    switch (activity.type) {
      case 'member_added':
        return {
          title: '👤 Novo Membro',
          body: activity.message,
          icon: '👤',
        };
      case 'member_deleted':
        return {
          title: '🗑️ Membro Removido',
          body: activity.message,
          icon: '🗑️',
        };
      case 'presence_marked':
        return {
          title: '✅ Presença Marcada',
          body: activity.message,
          icon: '✅',
        };
      case 'event_created':
        return {
          title: '📅 Novo Evento',
          body: activity.message,
          icon: '📅',
        };
      case 'ata_created':
        return {
          title: '📋 Nova Ata',
          body: activity.message,
          icon: '📋',
        };
      case 'versinho_added':
        return {
          title: '📖 Novo Versinho',
          body: activity.message,
          icon: '📖',
        };
      default:
        return {
          title: '📢 Nova Atividade',
          body: activity.message,
          icon: '📢',
        };
    }
  }

  /**
   * Solicita permissão para enviar notificações
   */
  static async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  /**
   * Verifica se tem permissão para enviar notificações
   */
  static async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Configura handler para notificações recebidas
   */
  static setupNotificationHandler(
    callback?: (notification: Notifications.Notification) => void
  ): void {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        callback?.(notification);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  }

  /**
   * Reseta preferências para padrão
   */
  static async resetPreferences(): Promise<void> {
    await this.savePreferences(DEFAULT_PREFS);
  }
}
