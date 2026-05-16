import React, { useState, useEffect } from 'react';
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
    ensure(`${year}-${mo}-${da}`);
    data[`${year}-${mo}-${da}`].birthdays.push(m.nome);
  });
  events.forEach(e => { ensure(e.data); data[e.data].events.push(e); });
  meetings.forEach(m => { ensure(m.data); data[m.data].meetings.push(m); });
  visitas.forEach(v => { ensure(v.data); data[v.data].visitas.push(v); });
  return data;
}

function MiniCalendar({ year, month, data }: any) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ day: daysInPrevMonth - i, isOtherMonth: true });
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, isOtherMonth: false });
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) days.push({ day: i, isOtherMonth: true });

  return (
    <View style={styles.miniCalendarContainer}>
      <View style={styles.miniCalendarHeader}>
        <Text style={styles.miniCalendarTitle}>{MONTHS_PT[month]} {year}</Text>
      </View>
      <View style={styles.miniCalendarDaysHeader}>
        {DAYS_PT_SHORT.map((d, i) => <Text key={i} style={styles.miniCalendarDayLabel}>{d}</Text>)}
      </View>
      <View style={styles.miniCalendarGrid}>
        {days.map((d, i) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
          const dayData = data[dateStr];
          const hasContent = dayData && (dayData.birthdays.length > 0 || dayData.events.length > 0 || dayData.meetings.length > 0 || dayData.visitas.length > 0);
          return (
            <View key={i} style={[styles.miniCalendarDay, d.isOtherMonth && styles.miniCalendarDayOther]}>
              <Text style={[styles.miniCalendarDayText, d.isOtherMonth && styles.miniCalendarDayTextOther]}>
                {d.day}
              </Text>
              {hasContent && <View style={styles.miniCalendarDayDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function EventsScreen() {
  const { events, meetings, members, visitas, saveEvents, autenticado, showToast, setEvents } = useApp();
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayISO());
  const [showModal, setShowModal] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  useFocusEffect(React.useCallback(() => {
    console.log('📅 EventsScreen focado - autenticado:', autenticado);
  }, [autenticado]));

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Erro', 'Digite o título do evento');
      return;
    }
    if (!autenticado) {
      showToast('⚠️ Você precisa estar autenticado para adicionar eventos', 'error');
      return;
    }

    const newEvent: CalEvent = {
      id: Date.now(),
      data: eventDate,
      titulo: eventTitle,
    };
    const updated = [...events, newEvent];
    await saveEvents(updated);
    // Sincronizar com outros usuários via WebSocket
    setEvents(updated);
    setEventTitle('');
    setEventDate(todayISO());
    setShowModal(false);
    showToast('✅ Evento adicionado!', 'success');
  };

  const calData = buildCalData(calendarYear, members, events, meetings, visitas);

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <StatsHeader />

        {/* Mini Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarYearControls}>
            <TouchableOpacity onPress={() => setCalendarYear(y => y - 1)}>
              <Text style={styles.calendarButton}>◀◀</Text>
            </TouchableOpacity>
            <Text style={styles.calendarYear}>{calendarYear}</Text>
            <TouchableOpacity onPress={() => setCalendarYear(y => y + 1)}>
              <Text style={styles.calendarButton}>▶▶</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.calendarControls}>
            <TouchableOpacity onPress={() => setCalendarMonth(m => m === 0 ? 11 : m - 1)}>
              <Text style={styles.calendarButton}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.calendarMonthYear}>{MONTHS_PT[calendarMonth]} {calendarYear}</Text>
            <TouchableOpacity onPress={() => setCalendarMonth(m => m === 11 ? 0 : m + 1)}>
              <Text style={styles.calendarButton}>▶</Text>
            </TouchableOpacity>
          </View>
          <MiniCalendar year={calendarYear} month={calendarMonth} data={calData} />
        </View>

        {/* Events List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Próximos Eventos</Text>
            {autenticado && (
              <TouchableOpacity onPress={() => setShowModal(true)}>
                <Text style={styles.addButton}>+ Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento agendado</Text>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={events}
              keyExtractor={(e) => e.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <View style={styles.eventDate}>
                    <Text style={styles.eventDateText}>{formatDate(item.data)}</Text>
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{item.titulo}</Text>
                    <Text style={styles.eventDesc}>Evento agendado</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Add Event Modal */}
        <Modal visible={showModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Evento</Text>
              <TextInput
                placeholder="Título do evento"
                value={eventTitle}
                onChangeText={setEventTitle}
                style={styles.input}
                placeholderTextColor="#64748b"
              />
              <TextInput
                placeholder="Data (YYYY-MM-DD)"
                value={eventDate}
                onChangeText={setEventDate}
                style={styles.input}
                placeholderTextColor="#64748b"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelButton}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddEvent} style={styles.saveButton}>
                  <Text style={styles.buttonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#6366f1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#e0e7ff',
    marginTop: 4,
  },
  calendarSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  calendarYearControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  calendarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarButton: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  miniCalendarContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  miniCalendarHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  miniCalendarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  miniCalendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  miniCalendarDayLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    width: '14.28%',
    textAlign: 'center',
  },
  miniCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniCalendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  miniCalendarDayOther: {
    opacity: 0.3,
  },
  miniCalendarDayText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
  },
  miniCalendarDayTextOther: {
    color: '#9ca3af',
  },
  miniCalendarDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366f1',
    position: 'absolute',
    bottom: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  eventDate: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  eventDateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  eventDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#1f2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1f2937',
  },
});
