import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, FlatList, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { formatDate, todayISO, CalEvent, Visitor, Visita } from '@/lib/db';

const MONTHS_PT_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_PT_SHORT = ['D','S','T','Q','Q','S','S'];

// ─── Stats Header ──────────────────────────────────────────────────────────────
function StatsHeader() {
  const { members, meetings } = useApp();
  const realMeetings = meetings.filter(m => !m.isScheduled || (m.present && m.present.length > 0));
  const avg = realMeetings.length
    ? Math.round(realMeetings.reduce((s, m) => s + (m.present ? m.present.length : 0), 0) / realMeetings.length)
    : 0;

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>⛪ Reunião de Jovens</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{members.length}</Text>
          <Text style={styles.statLabel}>MEMBROS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{realMeetings.length}</Text>
          <Text style={styles.statLabel}>REUNIÕES</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{realMeetings.length ? avg : '—'}</Text>
          <Text style={styles.statLabel}>MÉDIA</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Mini Calendar Month ───────────────────────────────────────────────────────
function buildCalData(year: number, members: any[], events: CalEvent[], meetings: any[], visitas: Visita[]) {
  const data: Record<string, { birthdays: string[]; events: CalEvent[]; meetings: any[]; visitas: Visita[] }> = {};
  const ensure = (d: string) => { if (!data[d]) data[d] = { birthdays: [], events: [], meetings: [], visitas: [] }; };
  members.filter(m => m.nascimento).forEach(m => {
    const [, mo, da] = m.nascimento.split('-');
    const key = `${year}-${mo}-${da}`;
    ensure(key); data[key].birthdays.push(m.nome);
  });
  events.forEach(ev => {
    if (ev.data && ev.data.startsWith(String(year))) { ensure(ev.data); data[ev.data].events.push(ev); }
  });
  meetings.forEach(mt => {
    if (mt.date && mt.date.startsWith(String(year))) { ensure(mt.date); data[mt.date].meetings.push(mt); }
  });
  visitas.forEach(v => {
    if (v.data && v.data.startsWith(String(year))) { ensure(v.data); data[v.data].visitas.push(v); }
  });
  return data;
}

interface MonthMiniProps {
  year: number; month: number;
  calData: Record<string, any>;
  onDayPress: (dateStr: string) => void;
}

function MonthMini({ year, month, calData, onDayPress }: MonthMiniProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const todayStr = todayISO();
  const moStr = String(month + 1).padStart(2, '0');

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const key = `${year}-${moStr}-${dd}`;
    const dow = new Date(year, month, d).getDay();
    const info = calData[key] || { birthdays: [], events: [], meetings: [], visitas: [] };
    cells.push({ d, key, dow, info, isToday: key === todayStr });
  }

  return (
    <View style={styles.monthMini}>
      <Text style={styles.monthTitle}>{MONTHS_PT_SHORT[month]}</Text>
      <View style={styles.monthGrid}>
        {DAYS_PT_SHORT.map((day, i) => (
          <Text key={i} style={[styles.mmDow, i === 0 && { color: '#ef4444' }, i === 6 && { color: '#3b82f6' }]}>{day}</Text>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <View key={`e${i}`} style={styles.mmDayEmpty} />;
          const { d, key, dow, info, isToday } = cell;
          const hasBirthday = info.birthdays.length > 0;
          const hasEvent = info.events.length > 0;
          const hasMeeting = info.meetings.length > 0;
          const hasVisita = info.visitas.length > 0;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.mmDay, isToday && styles.mmDayToday]}
              onPress={() => onDayPress(key)}
            >
              <Text style={[
                styles.mmDayText,
                isToday && { color: '#fff' },
                !isToday && dow === 0 && { color: '#ef4444' },
                !isToday && dow === 6 && { color: '#3b82f6' },
              ]}>{d}</Text>
              {(hasBirthday || hasEvent || hasMeeting || hasVisita) && (
                <View style={styles.mmDots}>
                  {hasBirthday && <View style={[styles.mmDot, { backgroundColor: '#ec4899' }]} />}
                  {hasEvent && <View style={[styles.mmDot, { backgroundColor: '#4f46e5' }]} />}
                  {hasMeeting && <View style={[styles.mmDot, { backgroundColor: '#22c55e' }]} />}
                  {hasVisita && <View style={[styles.mmDot, { backgroundColor: '#f59e0b' }]} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Day Detail Panel ──────────────────────────────────────────────────────────
function DayDetailPanel({ dateStr, calData, onDeleteEvent }: { dateStr: string; calData: Record<string, any>; onDeleteEvent: (id: number) => void }) {
  const info = calData[dateStr] || { birthdays: [], events: [], meetings: [], visitas: [] };
  const [y, m, d] = dateStr.split('-');
  const hasContent = info.birthdays.length || info.events.length || info.meetings.length || (info.visitas && info.visitas.length);
  if (!hasContent) return null;

  return (
    <View style={styles.dayDetailPanel}>
      <Text style={styles.dayDetailTitle}>📅 {d}/{m}/{y}</Text>
      {info.birthdays.map((nome: string, i: number) => (
        <View key={i} style={styles.ddiRow}>
          <Text style={styles.ddiIcon}>🎂</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ddiLabel}>{nome}</Text>
            <Text style={styles.ddiSub}>Aniversário</Text>
          </View>
        </View>
      ))}
      {info.meetings.map((mt: any, i: number) => {
        const isFut = dateStr > todayISO();
        const pres = mt.present ? mt.present.length : 0;
        return (
          <View key={i} style={styles.ddiRow}>
            <Text style={styles.ddiIcon}>⛪</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.ddiLabel}>{mt.title || 'Reunião de Jovens'}</Text>
              <Text style={styles.ddiSub}>{isFut ? 'Próxima reunião' : `${pres} presentes`}</Text>
            </View>
          </View>
        );
      })}
      {info.events.map((ev: CalEvent) => (
        <View key={ev.id} style={styles.ddiRow}>
          <Text style={styles.ddiIcon}>📌</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ddiLabel}>{ev.titulo}</Text>
            <Text style={styles.ddiSub}>{[ev.horario, ev.local].filter(Boolean).join(' · ')}</Text>
            {ev.obs ? <Text style={styles.ddiSub}>{ev.obs}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => onDeleteEvent(ev.id)} style={styles.delBtn}>
            <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
          </TouchableOpacity>
        </View>
      ))}
      {info.visitas && info.visitas.map((v: Visita) => (
        <View key={v.id} style={styles.ddiRow}>
          <Text style={styles.ddiIcon}>🏠</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.ddiLabel}>Visita na casa do(a) {v.nome}</Text>
            {v.horario ? <Text style={styles.ddiSub}>⏰ {v.horario}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Modal Novo Evento ─────────────────────────────────────────────────────────
function ModalNovoEvento({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (ev: Omit<CalEvent, 'id'>) => void }) {
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [local, setLocal] = useState('');
  const [obs, setObs] = useState('');
  const { showToast } = useApp();

  function handleSave() {
    if (!titulo.trim() || !data) { showToast('Preencha título e data!'); return; }
    onSave({ titulo: titulo.trim(), data, horario, local: local.trim(), obs: obs.trim() });
    setTitulo(''); setData(''); setHorario(''); setLocal(''); setObs('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📌 Novo Evento</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Título *</Text>
            <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} placeholder="Título do evento" placeholderTextColor="#94a3b8" />
            <Text style={styles.label}>Data * (AAAA-MM-DD)</Text>
            <TextInput style={styles.input} value={data} onChangeText={setData} placeholder="2025-06-15" placeholderTextColor="#94a3b8" keyboardType="numeric" />
            <Text style={styles.label}>Horário</Text>
            <TextInput style={styles.input} value={horario} onChangeText={setHorario} placeholder="19:00" placeholderTextColor="#94a3b8" />
            <Text style={styles.label}>Local</Text>
            <TextInput style={styles.input} value={local} onChangeText={setLocal} placeholder="Local do evento" placeholderTextColor="#94a3b8" />
            <Text style={styles.label}>Observações</Text>
            <TextInput style={[styles.input, { height: 70 }]} value={obs} onChangeText={setObs} placeholder="Observações..." placeholderTextColor="#94a3b8" multiline />
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>💾 Salvar Evento</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function EventosScreen() {
  const { events, meetings, members, visitas, saveEvents, autenticado, showToast } = useApp();
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setSelectedDay(null);
  }, []));

  const calData = buildCalData(annualYear, members, events, meetings, visitas);
  const today = todayISO();
  const upcomingEvents = [...events].filter(ev => ev.data >= today).sort((a, b) => a.data.localeCompare(b.data));

  function handleDayPress(dateStr: string) {
    setSelectedDay(prev => prev === dateStr ? null : dateStr);
  }

  function handleDeleteEvent(id: number) {
    Alert.alert('Excluir Evento', 'Deseja remover este evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await saveEvents(events.filter(ev => ev.id !== id));
          setSelectedDay(null);
          showToast('🗑 Evento removido');
        },
      },
    ]);
  }

  async function handleSaveEvent(ev: Omit<CalEvent, 'id'>) {
    const newEvent: CalEvent = { ...ev, id: Date.now() };
    await saveEvents([...events, newEvent]);
    showToast('✅ Evento salvo!');
  }

  function handleAddEvent() {
    if (autenticado) { setShowEventModal(true); }
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <StatsHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Calendar Card */}
        <View style={styles.card}>
          {/* Year Navigation */}
          <View style={styles.calNavRow}>
            <Text style={styles.calYearLabel}>📆 {annualYear}</Text>
            <View style={styles.calNavBtns}>
              <TouchableOpacity style={styles.calNavBtn} onPress={() => { setAnnualYear(y => y - 1); setSelectedDay(null); }}>
                <Text style={styles.calNavBtnText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calNavBtn} onPress={() => { setAnnualYear(y => y + 1); setSelectedDay(null); }}>
                <Text style={styles.calNavBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ec4899' }]} /><Text style={styles.legendText}>Aniversário</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4f46e5' }]} /><Text style={styles.legendText}>Evento</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} /><Text style={styles.legendText}>Reunião</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.legendText}>Visita</Text></View>
          </View>
          {/* Months */}
          {Array.from({ length: 12 }, (_, i) => (
            <MonthMini key={i} year={annualYear} month={i} calData={calData} onDayPress={handleDayPress} />
          ))}
          {/* Day Detail */}
          {selectedDay && (
            <DayDetailPanel dateStr={selectedDay} calData={calData} onDeleteEvent={handleDeleteEvent} />
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>📋 Próximos Eventos</Text>
            <TouchableOpacity style={styles.btnSmPrimary} onPress={handleAddEvent}>
              <Text style={styles.btnSmPrimaryText}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📌</Text>
              <Text style={styles.emptyText}>Nenhum evento programado</Text>
            </View>
          ) : (
            upcomingEvents.map(ev => (
              <View key={ev.id} style={styles.eventItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>📌 {ev.titulo}</Text>
                  <Text style={styles.eventSub}>📅 {formatDate(ev.data)}{ev.horario ? ` · ⏰ ${ev.horario}` : ''}</Text>
                  {ev.local ? <Text style={styles.eventSub}>📍 {ev.local}</Text> : null}
                  {ev.obs ? <Text style={styles.eventSub}>📝 {ev.obs}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleDeleteEvent(ev.id)} style={styles.delBtn}>
                  <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ModalNovoEvento
        onClose={() => setShowEventModal(false)}
        onSave={handleSaveEvent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#3730a3',
    paddingTop: 12, paddingBottom: 14, paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#4f46e5' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginHorizontal: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },

  calNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calYearLabel: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  calNavBtns: { flexDirection: 'row', gap: 8 },
  calNavBtn: { backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  calNavBtnText: { fontSize: 16, fontWeight: '700', color: '#4f46e5' },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#64748b' },

  monthMini: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginBottom: 10 },
  monthTitle: { textAlign: 'center', fontSize: 13, fontWeight: '800', color: '#4f46e5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mmDow: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#64748b', paddingVertical: 4 },
  mmDay: { width: '14.28%', aspectRatio: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  mmDayEmpty: { width: '14.28%', aspectRatio: 1 },
  mmDayToday: { backgroundColor: '#4f46e5' },
  mmDayText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  mmDots: { flexDirection: 'row', gap: 2, justifyContent: 'center', marginTop: 1 },
  mmDot: { width: 4, height: 4, borderRadius: 2 },

  dayDetailPanel: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  dayDetailTitle: { fontWeight: '800', fontSize: 14, color: '#4f46e5', marginBottom: 10 },
  ddiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  ddiIcon: { fontSize: 16, marginTop: 1 },
  ddiLabel: { fontWeight: '700', fontSize: 13 },
  ddiSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  delBtn: { padding: 4 },

  eventItem: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 4, borderLeftColor: '#4f46e5',
  },
  eventTitle: { fontWeight: '700', fontSize: 14 },
  eventSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },

  btnSmPrimary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnSmPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9,
    padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 4,
  },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 16 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
