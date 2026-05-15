import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Member {
  id: number;
  nome: string;
  genero: 'M' | 'F';
  continuacao: number;
  nascimento?: string; // YYYY-MM-DD
  tel?: string;
  foto?: string; // base64
  auxiliar?: boolean;
}

export interface Meeting {
  id: string;
  date: string; // YYYY-MM-DD
  present: number[];
  isScheduled?: boolean;
  title?: string;
}

export interface CalEvent {
  id: number;
  titulo: string;
  data: string; // YYYY-MM-DD
  horario?: string;
  local?: string;
  obs?: string;
}

export interface Visitor {
  id: string;
  comum: string;
}

export interface Visita {
  id: number;
  nome: string;
  data: string;
  horario?: string;
  endereco?: string;
  obs?: string;
  realizada?: boolean;
}

export interface Ata {
  id: number;
  data: string;
  auxiliares: number[];
  assunto: {
    tipo: 'texto' | 'doc' | 'foto';
    conteudo: string;
    nome?: string;
  };
  criadaEm: string;
}

export interface Versinho {
  id: number;
  data: string; // data da reunião
  livro: string;
  capitulos: number[];
  ordem: Array<{
    membroId: number;
    versiculos: number[];
  }>;
}

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  members:       'rj_members',
  meetings:      'rj_meetings',
  events:        'rj_events',
  visitors:      'rj_visitors',
  visitas:       'rj_visitas',
  visitasComuns: 'rj_visitas_comuns',
  atas:          'rj_atas',
  versinhos:     'rj_versinhos',
};

// ─── Generic helpers ─────────────────────────────────────────────────────────

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ─── DB API ──────────────────────────────────────────────────────────────────

export const DB = {
  // Members
  getMembers:   () => getItem<Member[]>(KEYS.members, []),
  setMembers:   (v: Member[]) => setItem(KEYS.members, v),

  // Meetings
  getMeetings:  () => getItem<Meeting[]>(KEYS.meetings, []),
  setMeetings:  (v: Meeting[]) => setItem(KEYS.meetings, v),

  // Events
  getEvents:    () => getItem<CalEvent[]>(KEYS.events, []),
  setEvents:    (v: CalEvent[]) => setItem(KEYS.events, v),

  // Visitors: { [meetingId]: Visitor[] }
  getVisitors:  () => getItem<Record<string, Visitor[]>>(KEYS.visitors, {}),
  setVisitors:  (v: Record<string, Visitor[]>) => setItem(KEYS.visitors, v),

  // Visitas
  getVisitas:   () => getItem<Visita[]>(KEYS.visitas, []),
  setVisitas:   (v: Visita[]) => setItem(KEYS.visitas, v),

  // Visitas comuns (checklist)
  getVisitasComuns: () => getItem<string[]>(KEYS.visitasComuns, []),
  setVisitasComuns: (v: string[]) => setItem(KEYS.visitasComuns, v),

  // Atas
  getAtas:      () => getItem<Ata[]>(KEYS.atas, []),
  setAtas:      (v: Ata[]) => setItem(KEYS.atas, v),

  // Versinhos
  getVersinhos: () => getItem<Versinho[]>(KEYS.versinhos, []),
  setVersinhos: (v: Versinho[]) => setItem(KEYS.versinhos, v),
};

// ─── Utilities ───────────────────────────────────────────────────────────────

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getNextSundayDate(): string {
  const today = new Date();
  const dow = today.getDay();
  const daysToAdd = dow === 0 ? 0 : 7 - dow;
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToAdd);
  return `${sunday.getFullYear()}-${String(sunday.getMonth()+1).padStart(2,'0')}-${String(sunday.getDate()).padStart(2,'0')}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function avatarColor(name: string): string {
  const colors = ['#4f46e5','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2','#0284c7'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function genderLabel(m: Member): string {
  return m.genero === 'M' ? 'Irmão' : 'Irmã';
}

export function contLabel(m: Member): string {
  const ord = ['','1ª','2ª','3ª','4ª','5ª'];
  return `${ord[m.continuacao] || m.continuacao}ª Cont.`;
}

export function initials(nome: string): string {
  return nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
}

export async function ensureNextSundayMeeting(): Promise<void> {
  const sundayDate = getNextSundayDate();
  const meetings = await DB.getMeetings();
  if (!meetings.some(m => m.date === sundayDate && m.isScheduled)) {
    meetings.push({
      id: 'sched_' + sundayDate,
      date: sundayDate,
      present: [],
      isScheduled: true,
      title: 'Reunião de Jovens',
    });
    await DB.setMeetings(meetings);
  }
}
