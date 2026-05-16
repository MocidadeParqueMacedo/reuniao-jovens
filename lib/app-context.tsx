import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { DB, Member, Meeting, CalEvent, Visitor, Visita, Ata, Versinho, ensureNextSundayMeeting, checkThreeConsecutiveAbsences } from './db';
import { loadCurrentUser, loadRegisteredUsers, saveRegisteredUsers, saveCurrentUser } from './auth-persistence';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './auth-store';
import { useWebSocketSync, registerWebSocketCallbacks } from './use-websocket-sync';

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Autenticação agora é apenas via Google OAuth - sem senha local

interface AuthState {
  autenticado: boolean;
  setAutenticado: (value: boolean) => void;
  logout: () => void;
}

interface AppData {
  members: Member[];
  meetings: Meeting[];
  events: CalEvent[];
  visitors: Record<string, Visitor[]>;
  visitas: Visita[];
  visitasComuns: string[];
  atas: Ata[];
  versinhos: Versinho[];
  loaded: boolean;
}

interface AppContextValue extends AuthState, AppData {
  reload: () => Promise<void>;
  saveMembers: (v: Member[]) => Promise<void>;
  saveMeetings: (v: Meeting[]) => Promise<void>;
  saveEvents: (v: CalEvent[]) => Promise<void>;
  saveVisitors: (v: Record<string, Visitor[]>) => Promise<void>;
  saveVisitas: (v: Visita[]) => Promise<void>;
  saveVisitasComuns: (v: string[]) => Promise<void>;
  saveAtas: (v: Ata[]) => Promise<void>;
  saveVersinhos: (v: Versinho[]) => Promise<void>;
  // Métodos para WebSocket (sincronização em tempo real)
  setMembers: (v: Member[]) => void;
  setMeetings: (v: Meeting[]) => void;
  setEvents: (v: CalEvent[]) => void;
  setVisitors: (v: Record<string, Visitor[]>) => void;
  setVisitas: (v: Visita[]) => void;
  setVisitasComuns: (v: string[]) => void;
  setAtas: (v: Ata[]) => void;
  setVersinhos: (v: Versinho[]) => void;
  checkAndNotifyAbsences: () => Promise<void>;
  // Toast
  toast: string;
  toastType: 'success' | 'error' | 'info';
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<AppData>({
    members: [], meetings: [], events: [], visitors: {},
    visitas: [], visitasComuns: [], atas: [], versinhos: [],
    loaded: false,
  });
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verificar autenticação ao iniciar o app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1️⃣ Garantir que o admin existe no AsyncStorage
        const users = await loadRegisteredUsers();
        if (!users[ADMIN_EMAIL]) {
          console.log('🔐 Admin não encontrado. Criando admin automaticamente...');
          const updatedUsers = {
            ...users,
            [ADMIN_EMAIL]: {
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
              approved: true,
              createdAt: new Date().toISOString(),
            },
          };
          await saveRegisteredUsers(updatedUsers);
          console.log('✅ Admin criado com sucesso!');
        }

        // 2️⃣ Verificar se o usuário atual está autenticado
        const currentUserEmail = await loadCurrentUser();
        if (currentUserEmail) {
          // Recarregar usuários para pegar a versão atualizada
          const updatedUsers = await loadRegisteredUsers();
          const user = updatedUsers[currentUserEmail];
          if (user && user.approved) {
            setAutenticado(true);
          } else {
            // Usuário não está mais aprovado, limpa a sessão
            setAutenticado(false);
          }
        }
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const reload = useCallback(async () => {
    await ensureNextSundayMeeting();
    const [members, meetings, events, visitors, visitas, visitasComuns, atas, versinhos] = await Promise.all([
      DB.getMembers(), DB.getMeetings(), DB.getEvents(), DB.getVisitors(),
      DB.getVisitas(), DB.getVisitasComuns(), DB.getAtas(), DB.getVersinhos(),
    ]);
    setData({ members, meetings, events, visitors, visitas, visitasComuns, atas, versinhos, loaded: true });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const logout = useCallback(async () => {
    // Limpar dados da sessão do AsyncStorage
    await saveCurrentUser(null);
    setAutenticado(false);
  }, []);

  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast(msg);
    setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const saveMembers = useCallback(async (v: Member[]) => {
    await DB.setMembers(v);
    setData(d => ({ ...d, members: v }));
  }, []);

  const saveMeetings = useCallback(async (v: Meeting[]) => {
    await DB.setMeetings(v);
    setData(d => ({ ...d, meetings: v }));
  }, []);

  const saveEvents = useCallback(async (v: CalEvent[]) => {
    await DB.setEvents(v);
    setData(d => ({ ...d, events: v }));
  }, []);

  const saveVisitors = useCallback(async (v: Record<string, Visitor[]>) => {
    await DB.setVisitors(v);
    setData(d => ({ ...d, visitors: v }));
  }, []);

  const saveVisitas = useCallback(async (v: Visita[]) => {
    await DB.setVisitas(v);
    setData(d => ({ ...d, visitas: v }));
  }, []);

  const saveVisitasComuns = useCallback(async (v: string[]) => {
    await DB.setVisitasComuns(v);
    setData(d => ({ ...d, visitasComuns: v }));
  }, []);

  const saveAtas = useCallback(async (v: Ata[]) => {
    await DB.setAtas(v);
    setData(d => ({ ...d, atas: v }));
  }, []);

  const saveVersinhos = useCallback(async (v: Versinho[]) => {
    await DB.setVersinhos(v);
    setData(d => ({ ...d, versinhos: v }));
  }, []);

  // Métodos para WebSocket (sem salvar no AsyncStorage, apenas atualizar estado)
  const setMembers = useCallback((v: Member[]) => {
    setData(d => ({ ...d, members: v }));
  }, []);

  const setMeetings = useCallback((v: Meeting[]) => {
    setData(d => ({ ...d, meetings: v }));
  }, []);

  const setEvents = useCallback((v: CalEvent[]) => {
    setData(d => ({ ...d, events: v }));
  }, []);

  const setVisitors = useCallback((v: Record<string, Visitor[]>) => {
    setData(d => ({ ...d, visitors: v }));
  }, []);

  const setVisitas = useCallback((v: Visita[]) => {
    setData(d => ({ ...d, visitas: v }));
  }, []);

  const setVisitasComuns = useCallback((v: string[]) => {
    setData(d => ({ ...d, visitasComuns: v }));
  }, []);

  const setAtas = useCallback((v: Ata[]) => {
    setData(d => ({ ...d, atas: v }));
  }, []);

  const setVersinhos = useCallback((v: Versinho[]) => {
    setData(d => ({ ...d, versinhos: v }));
  }, []);

  // Registrar callbacks para WebSocket
  useEffect(() => {
    registerWebSocketCallbacks({
      members: setMembers,
      meetings: setMeetings,
      events: setEvents,
      visitors: setVisitors,
      visitas: setVisitas,
      visitasComuns: setVisitasComuns,
      atas: setAtas,
      versinhos: setVersinhos,
    });
  }, [setMembers, setMeetings, setEvents, setVisitors, setVisitas, setVisitasComuns, setAtas, setVersinhos]);

  // Inicializar sincronização WebSocket
  useWebSocketSync();

  const checkAndNotifyAbsences = useCallback(async () => {
    const members = data.members;
    const meetings = data.meetings;
    const visitas = data.visitas;

    for (const member of members) {
      const hasThreeAbsences = checkThreeConsecutiveAbsences(member.id, meetings);
      const alreadyInVisitas = visitas.some(v => v.nome.toLowerCase() === member.nome.toLowerCase());

      if (hasThreeAbsences && !alreadyInVisitas) {
        const novaVisita: Visita = {
          id: Date.now(),
          nome: member.nome,
          data: new Date().toISOString().split('T')[0],
          realizada: false,
        };
        const updatedVisitas = [...visitas, novaVisita];
        await saveVisitas(updatedVisitas);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Membro com 3 Faltas',
            body: `${member.nome} faltou 3 reunioes seguidas e foi adicionado a lista de visitas.`,
            sound: 'default',
          },
          trigger: null,
        });

        showToast(`⚠️ ${member.nome} adicionado a lista de visitas (3 faltas)`);
      }
    }
  }, [data.members, data.meetings, data.visitas, saveVisitas, showToast]);

  return (
    <AppContext.Provider value={{
      autenticado: authLoading ? false : autenticado, setAutenticado, logout,
      ...data,
      reload,
      saveMembers, saveMeetings, saveEvents, saveVisitors,
      saveVisitas, saveVisitasComuns, saveAtas, saveVersinhos,
      setMembers, setMeetings, setEvents, setVisitors,
      setVisitas, setVisitasComuns, setAtas, setVersinhos,
      checkAndNotifyAbsences,
      toast, toastType, showToast,
    }}
    >
      {!authLoading && children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
