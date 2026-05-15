import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { DB, Member, Meeting, CalEvent, Visitor, Visita, Ata, Versinho, ensureNextSundayMeeting, checkThreeConsecutiveAbsences } from './db';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const SENHA_CORRETA = 'HOUVEUMSILENCIONOCEU';

interface AuthState {
  autenticado: boolean;
  tentarLogin: (senha: string) => boolean;
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
  checkAndNotifyAbsences: () => Promise<void>;
  // Toast
  toast: string;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [autenticado, setAutenticado] = useState(false);
  const [data, setData] = useState<AppData>({
    members: [], meetings: [], events: [], visitors: {},
    visitas: [], visitasComuns: [], atas: [], versinhos: [],
    loaded: false,
  });
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    await ensureNextSundayMeeting();
    const [members, meetings, events, visitors, visitas, visitasComuns, atas, versinhos] = await Promise.all([
      DB.getMembers(), DB.getMeetings(), DB.getEvents(), DB.getVisitors(),
      DB.getVisitas(), DB.getVisitasComuns(), DB.getAtas(), DB.getVersinhos(),
    ]);
    setData({ members, meetings, events, visitors, visitas, visitasComuns, atas, versinhos, loaded: true });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const tentarLogin = useCallback((senha: string): boolean => {
    if (senha === SENHA_CORRETA) { setAutenticado(true); return true; }
    return false;
  }, []);

  const logout = useCallback(() => setAutenticado(false), []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
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
      autenticado, tentarLogin, logout,
      ...data,
      reload,
      saveMembers, saveMeetings, saveEvents, saveVisitors,
      saveVisitas, saveVisitasComuns, saveAtas, saveVersinhos,
      checkAndNotifyAbsences,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
