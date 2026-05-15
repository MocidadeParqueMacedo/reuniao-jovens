import AsyncStorage from '@react-native-async-storage/async-storage';

const REGISTERED_USERS_KEY = 'reuniao_jovens_registered_users';
const CURRENT_USER_KEY = 'reuniao_jovens_current_user';

export interface RegisteredUser {
  email: string;
  password: string;
  approved: boolean;
  createdAt: string;
}

/**
 * Carrega usuários registrados do AsyncStorage
 */
export async function loadRegisteredUsers(): Promise<Record<string, RegisteredUser>> {
  try {
    const data = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    return {};
  }
}

/**
 * Salva usuários registrados no AsyncStorage
 */
export async function saveRegisteredUsers(users: Record<string, RegisteredUser>): Promise<void> {
  try {
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Erro ao salvar usuários:', error);
  }
}

/**
 * Carrega o usuário logado atualmente
 */
export async function loadCurrentUser(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Erro ao carregar usuário atual:', error);
    return null;
  }
}

/**
 * Salva o usuário logado atualmente
 */
export async function saveCurrentUser(email: string | null): Promise<void> {
  try {
    if (email) {
      await AsyncStorage.setItem(CURRENT_USER_KEY, email);
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error('Erro ao salvar usuário atual:', error);
  }
}

/**
 * Limpa todos os dados de autenticação
 */
export async function clearAuthData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([REGISTERED_USERS_KEY, CURRENT_USER_KEY]);
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error);
  }
}
