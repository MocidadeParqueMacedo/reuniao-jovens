import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, FlatList, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LoginModal } from '@/components/LoginModal';
import { useApp } from '@/lib/app-context';
import { formatDate, todayISO, Member, Visitor } from '@/lib/db';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FiltroAtivo {
  dateIni: string | null;
  dateFim: string | null;
  memberIds: number[] | null;
  tipoMembro: 'comum' | 'comum_visitantes' | 'visitantes';
}

// ─── Presença Detail Screen ────────────────────────────────────────────────────
function PresencaScreen({
  meetingId,
  onBack,
}: {
  meetingId: string;
  onBack: () => void;
}) {
  const { meetings, members, visitors, saveMeetings, saveVisitors, showToast } = useApp();
  const meeting = meetings.find(m => String(m.id || m.date) === String(meetingId));
  const [presenca, setPresenca] = useState<Record<string, boolean>>({});
  const [presVisitantes, setPresVisitantes] = useState<Visitor[]>([]);
  const [tipoMembro, setTipoMembro] = useState<'comum' | 'comum_visitantes' | 'visitantes'>('comum');
  const [generoFiltro, setGeneroFiltro] = useState<'todos' | 'M' | 'F'>('todos');
  const [search, setSearch] = useState('');
  const [showAddVisitante, setShowAddVisitante] = useState(false);
  const [novaComum, setNovaComum] = useState('');

  useFocusEffect(useCallback(() => {
    if (!meeting) return;
    const presMap: Record<string, boolean> = {};
    (meeting.present || []).forEach(id => { presMap[id] = true; });
    setPresenca(presMap);
    const vis = visitors[String(meetingId)] || [];
    const visPresMap: Record<string, boolean> = {};
    vis.forEach(v => { visPresMap[v.id] = true; });
    Object.assign(presMap, visPresMap);
    setPresVisitantes(vis);
    setPresenca({ ...presMap });
  }, [meetingId, meetings, visitors]));

  if (!meeting) return null;

  function togglePresenca(id: string | number) {
    setPresenca(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function salvar() {
    const present = Object.entries(presenca)
      .filter(([k, v]) => v && !String(k).startsWith('v_'))
      .map(([k]) => parseInt(k));
    const updated = meetings.map(m =>
      String(m.id || m.date) === String(meetingId) ? { ...m, present } : m
    );
    await saveMeetings(updated);
    const allVisitors = { ...visitors };
    allVisitors[String(meetingId)] = presVisitantes;
    await saveVisitors(allVisitors);
    showToast('✅ Presença salva!');
  }

  function limpar() { setPresenca({}); }

  function adicionarVisitante() {
    if (!novaComum.trim()) return;
    const id = `v_${Date.now()}`;
    const novo: Visitor = { id, comum: novaComum.trim() };
    setPresVisitantes(prev => [...prev, novo]);
    setPresenca(prev => ({ ...prev, [id]: true }));
    setNovaComum('');
    setShowAddVisitante(false);
  }

  function excluirVisitante(id: string) {
    setPresVisitantes(prev => prev.filter(v => v.id !== id));
    setPresenca(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  let filteredMembers = members;
  if (generoFiltro !== 'todos') filteredMembers = filteredMembers.filter(m => m.genero === generoFiltro);
  if (search) filteredMembers = filteredMembers.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

  const avatarColor = (nome: string) => {
    const colors = ['#4f46e5','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2'];
    let h = 0; for (let i = 0; i < nome.length; i++) h = nome.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const initials = (nome: string) => nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const contLabel = (m: Member) => { const o=['','1ª','2ª','3ª','4ª','5ª']; return `${o[m.continuacao]||m.continuacao} Cont.`; };
  const gLabel = (m: Member) => m.genero === 'M' ? 'Irmão' : 'Irmã';

  return (
    <View style={{ flex: 1 }}>
      <View style={pStyles.header}>
        <TouchableOpacity style={pStyles.backBtn} onPress={onBack}>
          <Text style={pStyles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={pStyles.title} numberOfLines={1}>{meeting.title || 'Reunião de Jovens'}</Text>
          <Text style={pStyles.sub}>📅 {formatDate(meeting.date)}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Tipo de membro */}
        <View style={pStyles.card}>
          <Text style={pStyles.label}>Exibir</Text>
          {(['comum', 'comum_visitantes', 'visitantes'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[pStyles.selectOpt, tipoMembro === t && pStyles.selectOptActive]}
              onPress={() => setTipoMembro(t)}
            >
              <Text style={[pStyles.selectOptText, tipoMembro === t && { color: '#4f46e5', fontWeight: '700' }]}>
                {t === 'comum' ? '👥 Comum (membros cadastrados)' : t === 'comum_visitantes' ? '👥+👤 Comum + Visitantes' : '👤 Visitantes'}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Filtro gênero */}
          <View style={pStyles.genRow}>
            {(['todos','M','F'] as const).map(g => (
              <TouchableOpacity
                key={g}
                style={[pStyles.genBtn, generoFiltro === g && pStyles.genBtnActive]}
                onPress={() => setGeneroFiltro(g)}
              >
                <Text style={[pStyles.genBtnText, generoFiltro === g && { color: '#fff' }]}>
                  {g === 'todos' ? '👥 Todos' : g === 'M' ? '👨 Irmãos' : '👩 Irmãs'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={pStyles.searchWrap}>
            <Text style={pStyles.searchIcon}>🔍</Text>
            <TextInput
              style={pStyles.searchInput}
              placeholder="Buscar membro..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Members list */}
          {(tipoMembro === 'comum' || tipoMembro === 'comum_visitantes') && filteredMembers.map(m => (
            <View key={m.id} style={pStyles.presItem}>
              <View style={[pStyles.avatar, { backgroundColor: avatarColor(m.nome) }]}>
                <Text style={pStyles.avatarText}>{initials(m.nome)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pStyles.memberName}>{m.nome}</Text>
                <Text style={pStyles.memberSub}>{gLabel(m)} · {contLabel(m)}</Text>
              </View>
              <TouchableOpacity
                style={[pStyles.toggle, presenca[m.id] && pStyles.toggleChecked]}
                onPress={() => togglePresenca(m.id)}
              />
            </View>
          ))}

          {/* Visitors */}
          {(tipoMembro === 'comum_visitantes' || tipoMembro === 'visitantes') && (
            <>
              {tipoMembro === 'comum_visitantes' && presVisitantes.length > 0 && (
                <Text style={pStyles.sectionDivider}>— Visitantes —</Text>
              )}
              {presVisitantes.map(v => (
                <View key={v.id} style={pStyles.presItem}>
                  <View style={[pStyles.avatar, { backgroundColor: '#f59e0b' }]}>
                    <Text style={pStyles.avatarText}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={pStyles.memberName}>Visitante, {v.comum}</Text>
                    <Text style={pStyles.memberSub}>Visitante</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                      <TouchableOpacity onPress={() => excluirVisitante(v.id)}>
                        <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>🗑 Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[pStyles.toggle, presenca[v.id] && pStyles.toggleChecked]}
                    onPress={() => togglePresenca(v.id)}
                  />
                </View>
              ))}
              {tipoMembro === 'visitantes' && presVisitantes.length === 0 && (
                <View style={pStyles.empty}>
                  <Text style={pStyles.emptyIcon}>👤</Text>
                  <Text style={pStyles.emptyText}>Nenhum visitante nesta reunião</Text>
                </View>
              )}
            </>
          )}

          {/* Add visitante */}
          <TouchableOpacity
            style={pStyles.addVisBtn}
            onPress={() => setShowAddVisitante(v => !v)}
          >
            <Text style={pStyles.addVisBtnText}>➕ Adicionar Visitante</Text>
          </TouchableOpacity>
          {showAddVisitante && (
            <View style={pStyles.addVisForm}>
              <Text style={pStyles.addVisLabel}>Qual a comum?</Text>
              <TextInput
                style={pStyles.addVisInput}
                placeholder="Nome da comum..."
                placeholderTextColor="#94a3b8"
                value={novaComum}
                onChangeText={setNovaComum}
              />
              <TouchableOpacity style={pStyles.btnPrimary} onPress={adicionarVisitante}>
                <Text style={pStyles.btnPrimaryText}>✅ Adicionar Visitante</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={pStyles.actionRow}>
            <TouchableOpacity style={pStyles.btnPrimary} onPress={salvar}>
              <Text style={pStyles.btnPrimaryText}>💾 Salvar Presença</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pStyles.btnSecondary} onPress={limpar}>
              <Text style={pStyles.btnSecondaryText}>🗑 Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main Histórico Screen ─────────────────────────────────────────────────────
export default function HistoricoScreen() {
  const { meetings, members, visitors, saveMeetings, autenticado, showToast } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [filtroAno, setFiltroAno] = useState('todas');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const [filtroTipoMembro, setFiltroTipoMembro] = useState<'comum' | 'comum_visitantes' | 'visitantes'>('comum');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>({
    dateIni: null, dateFim: null, memberIds: null, tipoMembro: 'comum',
  });

  useFocusEffect(useCallback(() => {
    if (!autenticado) {
      setShowLogin(true);
    }
  }, [autenticado]));

  const today = todayISO();
  const anos = Array.from(new Set(meetings.map(m => m.date.split('-')[0]))).sort((a, b) => b.localeCompare(a));

  function getMemberIdsByGrupo() {
    if (filtroGrupo === 'todos') return members.map(m => m.id);
    if (filtroGrupo === 'irmaos') return members.filter(m => m.genero === 'M').map(m => m.id);
    if (filtroGrupo === 'irmas') return members.filter(m => m.genero === 'F').map(m => m.id);
    if (filtroGrupo === 'criancas') return members.filter(m => m.continuacao <= 2).map(m => m.id);
    if (filtroGrupo === 'mocidade') return members.filter(m => (m.genero === 'F' && m.continuacao >= 3) || (m.genero === 'M' && m.continuacao === 3)).map(m => m.id);
    return members.map(m => m.id);
  }

  function aplicarFiltro() {
    const memberIds = getMemberIdsByGrupo();
    let dateIni: string | null = null, dateFim: string | null = null;
    if (filtroAno !== 'todas') { dateIni = `${filtroAno}-01-01`; dateFim = `${filtroAno}-12-31`; }
    setFiltroAtivo({ dateIni, dateFim, memberIds, tipoMembro: filtroTipoMembro });
  }

  let filteredMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date));
  if (filtroAtivo.dateIni) filteredMeetings = filteredMeetings.filter(m => m.date >= filtroAtivo.dateIni!);
  if (filtroAtivo.dateFim) filteredMeetings = filteredMeetings.filter(m => m.date <= filtroAtivo.dateFim!);

  function countPresentes(mt: any) {
    const mid = String(mt.id || mt.date);
    const presentAll = mt.present || [];
    const meetingVisitors = visitors[mid] || [];
    let count = 0;
    const tm = filtroAtivo.tipoMembro;
    if (tm === 'comum' || tm === 'comum_visitantes') {
      const ids = filtroAtivo.memberIds;
      count += ids ? presentAll.filter((id: number) => ids.includes(id)).length : presentAll.length;
    }
    if (tm === 'comum_visitantes' || tm === 'visitantes') count += meetingVisitors.length;
    return count;
  }

  async function deletarReuniao(meetingId: string) {
    Alert.alert('Excluir Reunião', 'Deseja excluir esta reunião?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await saveMeetings(meetings.filter(m => String(m.id || m.date) !== String(meetingId)));
          showToast('🗑 Reunião removida');
        },
      },
    ]);
  }

  function abrirPresenca(meetingId: string) {
    setCurrentMeetingId(meetingId);
  }

  if (!autenticado) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={hStyles.lockedContainer}>
          <Text style={hStyles.lockedIcon}>🔐</Text>
          <Text style={hStyles.lockedText}>Esta seção requer autenticação</Text>
          <TouchableOpacity style={hStyles.btnPrimary} onPress={() => setShowLogin(true)}>
            <Text style={hStyles.btnPrimaryText}>🔓 Entrar</Text>
          </TouchableOpacity>
        </View>
        <LoginModal visible={showLogin} onSuccess={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />
      </ScreenContainer>
    );
  }

  if (currentMeetingId) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <PresencaScreen meetingId={currentMeetingId} onBack={() => setCurrentMeetingId(null)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={hStyles.header}>
        <Text style={hStyles.headerTitle}>🕐 Histórico</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Filtros */}
        <View style={hStyles.card}>
          <Text style={hStyles.cardTitle}>🔍 Filtros</Text>
          <Text style={hStyles.label}>Ano</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {['todas', ...anos].map(a => (
              <TouchableOpacity
                key={a}
                style={[hStyles.filterChip, filtroAno === a && hStyles.filterChipActive]}
                onPress={() => setFiltroAno(a)}
              >
                <Text style={[hStyles.filterChipText, filtroAno === a && { color: '#fff' }]}>
                  {a === 'todas' ? 'Todos' : a}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={hStyles.label}>Grupo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {[
              { v: 'todos', l: '👥 Todos' },
              { v: 'irmaos', l: '👨 Irmãos' },
              { v: 'irmas', l: '👩 Irmãs' },
              { v: 'criancas', l: '👧🧒 Crianças' },
              { v: 'mocidade', l: '🧑‍🤝‍🧑 Mocidade' },
            ].map(({ v, l }) => (
              <TouchableOpacity
                key={v}
                style={[hStyles.filterChip, filtroGrupo === v && hStyles.filterChipActive]}
                onPress={() => setFiltroGrupo(v)}
              >
                <Text style={[hStyles.filterChipText, filtroGrupo === v && { color: '#fff' }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={hStyles.label}>Tipo de Membro</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {[
              { v: 'comum' as const, l: '👥 Comum' },
              { v: 'comum_visitantes' as const, l: '👥+👤 Comum + Visitantes' },
              { v: 'visitantes' as const, l: '👤 Visitantes' },
            ].map(({ v, l }) => (
              <TouchableOpacity
                key={v}
                style={[hStyles.filterChip, filtroTipoMembro === v && hStyles.filterChipActive]}
                onPress={() => setFiltroTipoMembro(v)}
              >
                <Text style={[hStyles.filterChipText, filtroTipoMembro === v && { color: '#fff' }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={hStyles.btnPrimary} onPress={aplicarFiltro}>
            <Text style={hStyles.btnPrimaryText}>✅ Aplicar Filtro</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de reuniões */}
        <View style={hStyles.card}>
          <View style={hStyles.cardHeaderRow}>
            <Text style={hStyles.cardTitle}>📅 Reuniões</Text>
            <Text style={hStyles.resumoText}>{filteredMeetings.length} reunião(ões)</Text>
          </View>
          {filteredMeetings.length === 0 ? (
            <View style={hStyles.empty}>
              <Text style={hStyles.emptyIcon}>📅</Text>
              <Text style={hStyles.emptyText}>Nenhuma reunião nesse período</Text>
            </View>
          ) : (
            filteredMeetings.map(mt => {
              const mid = String(mt.id || mt.date);
              const isFuture = mt.date > today, isToday = mt.date === today;
              const count = countPresentes(mt);
              const countText = isFuture
                ? (count > 0 ? `👥 ${count} presentes` : '⏳ Aguardando presença')
                : `👥 ${count} presentes`;
              return (
                <TouchableOpacity key={mid} style={hStyles.histItem} onPress={() => abrirPresenca(mid)}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={hStyles.histDate}>⛪ {mt.title || 'Reunião de Jovens'}</Text>
                      {isFuture && <View style={hStyles.tagProxima}><Text style={hStyles.tagProximaText}>Próxima</Text></View>}
                      {isToday && <View style={hStyles.tagHoje}><Text style={hStyles.tagHojeText}>Hoje</Text></View>}
                    </View>
                    <Text style={hStyles.histSub}>📅 {formatDate(mt.date)}</Text>
                    <Text style={hStyles.histCount}>{countText}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); deletarReuniao(mid); }}
                      style={hStyles.delBtn}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                    <Text style={hStyles.arrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      <LoginModal visible={showLogin} onSuccess={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />
    </ScreenContainer>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const hStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5', marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  filterChip: {
    backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginRight: 8, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  resumoText: { fontSize: 11, color: '#64748b' },
  histItem: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  histDate: { fontWeight: '700', fontSize: 14 },
  histSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  histCount: { fontSize: 13, color: '#64748b', marginTop: 2 },
  tagProxima: { backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagProximaText: { fontSize: 11, color: '#d97706', fontWeight: '700' },
  tagHoje: { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagHojeText: { fontSize: 11, color: '#4f46e5', fontWeight: '700' },
  arrow: { fontSize: 18, color: '#818cf8' },
  delBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
});

const pStyles = StyleSheet.create({
  header: {
    backgroundColor: '#3730a3', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  backText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  title: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sub: { color: '#c7d2fe', fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  selectOpt: {
    padding: 10, borderRadius: 9, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 6, backgroundColor: '#f8fafc',
  },
  selectOptActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  selectOptText: { fontSize: 14, color: '#1e293b' },
  genRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  genBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
  genBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  genBtnText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, backgroundColor: '#f1f5f9', marginBottom: 12 },
  searchIcon: { paddingLeft: 10, fontSize: 16 },
  searchInput: { flex: 1, padding: 10, fontSize: 14, color: '#1e293b' },
  presItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  memberName: { fontWeight: '700', fontSize: 14 },
  memberSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  toggle: { width: 44, height: 24, backgroundColor: '#e2e8f0', borderRadius: 12 },
  toggleChecked: { backgroundColor: '#22c55e' },
  sectionDivider: { fontSize: 12, fontWeight: '700', color: '#64748b', paddingVertical: 8, textAlign: 'center' },
  addVisBtn: { marginTop: 12, borderWidth: 1.5, borderColor: '#818cf8', borderRadius: 10, padding: 10, alignItems: 'center', backgroundColor: '#f8fafc' },
  addVisBtnText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  addVisForm: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1.5, borderColor: '#e2e8f0' },
  addVisLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  addVisInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 9, fontSize: 14, backgroundColor: '#fff', color: '#1e293b', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btnPrimary: { flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, padding: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#818cf8' },
  btnSecondaryText: { color: '#4f46e5', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
});
