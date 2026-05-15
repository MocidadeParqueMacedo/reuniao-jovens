import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LoginModal } from '@/components/LoginModal';
import { PresencaChart } from '@/components/PresencaChart';
import { useApp } from '@/lib/app-context';
import { formatDate, todayISO, Member, Visitor, PERIODOS_MAP, getDateRangeFromPeriod } from '@/lib/db';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import { exportPresencaToPDF } from '@/lib/exportPresencaPDF';


// ─── Função para obter próximo domingo ───────────────────────────────────────
function getNextSundayDate(): string {
  const today = new Date();
  const dow = today.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
  const daysToAdd = dow === 0 ? 0 : 7 - dow;
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToAdd);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, '0');
  const d = String(sunday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  const { isOnline } = useNetworkStatus();
  const meeting = meetings.find(m => String(m.id || m.date) === String(meetingId));
  const [presenca, setPresenca] = useState<Record<string, boolean>>({});
  const [presVisitantes, setPresVisitantes] = useState<Visitor[]>([]);
  const [tipoMembro, setTipoMembro] = useState<'comum' | 'comum_visitantes' | 'visitantes'>('comum');
  const [generoFiltro, setGeneroFiltro] = useState<'todos' | 'M' | 'F'>('todos');
  const [continuacaoFiltro, setContinuacaoFiltro] = useState<string>('todas');
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
    if (!novaComum.trim()) {
      showToast('Informe a comum!');
      return;
    }
    const id = `v_${Date.now()}`;
    const novo: Visitor = { id, comum: novaComum.trim() };
    setPresVisitantes(prev => [...prev, novo]);
    setPresenca(prev => ({ ...prev, [id]: true }));
    setNovaComum('');
    setShowAddVisitante(false);
    showToast('✅ Visitante adicionado!');
  }

  function excluirVisitante(id: string) {
    setPresVisitantes(prev => prev.filter(v => v.id !== id));
    setPresenca(prev => { const n = { ...prev }; delete n[id]; return n; });
    showToast('🗑 Visitante removido');
  }

  // Obter continuações disponíveis por gênero
  function getContsByGenero(genero: 'M' | 'F'): number[] {
    if (genero === 'M') return [1, 2, 3]; // Irmãos: 1ª, 2ª, 3ª
    return [1, 2, 3, 4, 5]; // Irmãs: 1ª, 2ª, 3ª, 4ª, 5ª
  }

  let filteredMembers = members;
  if (generoFiltro !== 'todos') filteredMembers = filteredMembers.filter(m => m.genero === generoFiltro);
  if (generoFiltro !== 'todos' && continuacaoFiltro !== 'todas') {
    const cont = parseInt(continuacaoFiltro);
    filteredMembers = filteredMembers.filter(m => m.continuacao === cont);
  }
  if (search) filteredMembers = filteredMembers.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

  const avatarColor = (nome: string) => {
    const colors = ['#4f46e5','#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2'];
    let h = 0; for (let i = 0; i < nome.length; i++) h = nome.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const initials = (nome: string) => nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const contLabel = (m: Member) => { const o=['','1ª','2ª','3ª','4ª','5ª']; return `${o[m.continuacao]||m.continuacao} Cont.`; };
  const gLabel = (m: Member) => m.genero === 'M' ? 'Irmão' : 'Irmã';

  const contDisponíveis = generoFiltro !== 'todos' ? getContsByGenero(generoFiltro as 'M' | 'F') : [];

  return (
    <View style={hStyles.presencaContainer}>
      <View style={hStyles.presencaHeader}>
        <TouchableOpacity onPress={onBack} style={hStyles.backBtn}>
          <Text style={hStyles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View>
          <Text style={hStyles.presencaTitle}>Presença</Text>
          <Text style={hStyles.presencaDate}>{formatDate(meeting.date)}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Filtro de Tipo de Membro */}
        <View style={hStyles.card}>
          <Text style={hStyles.label}>Exibir</Text>
          <View style={hStyles.pickerContainer}>
            <Picker
              selectedValue={tipoMembro}
              onValueChange={setTipoMembro}
              style={hStyles.picker}
            >
              <Picker.Item label="👥 Comum (membros cadastrados)" value="comum" />
              <Picker.Item label="👥+👤 Comum + Visitantes" value="comum_visitantes" />
              <Picker.Item label="👤 Visitantes" value="visitantes" />
            </Picker>
          </View>
        </View>

        {/* Filtro de Gênero */}
        <View style={hStyles.filterRow}>
          <TouchableOpacity
            style={[hStyles.filterBtn, generoFiltro === 'todos' && hStyles.filterBtnActive]}
            onPress={() => { setGeneroFiltro('todos'); setContinuacaoFiltro('todas'); }}
          >
            <Text style={[hStyles.filterBtnText, generoFiltro === 'todos' && { color: '#fff' }]}>👥 Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[hStyles.filterBtn, generoFiltro === 'M' && hStyles.filterBtnActive]}
            onPress={() => { setGeneroFiltro('M'); setContinuacaoFiltro('todas'); }}
          >
            <Text style={[hStyles.filterBtnText, generoFiltro === 'M' && { color: '#fff' }]}>👨 Irmãos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[hStyles.filterBtn, generoFiltro === 'F' && hStyles.filterBtnActive]}
            onPress={() => { setGeneroFiltro('F'); setContinuacaoFiltro('todas'); }}
          >
            <Text style={[hStyles.filterBtnText, generoFiltro === 'F' && { color: '#fff' }]}>👩 Irmãs</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-filtro de Continuação (aparece quando Irmãos ou Irmãs selecionado) */}
        {generoFiltro !== 'todos' && (
          <View style={hStyles.filterRow}>
            <TouchableOpacity
              style={[hStyles.filterBtn, continuacaoFiltro === 'todas' && hStyles.filterBtnActive]}
              onPress={() => setContinuacaoFiltro('todas')}
            >
              <Text style={[hStyles.filterBtnText, continuacaoFiltro === 'todas' && { color: '#fff' }]}>Todas</Text>
            </TouchableOpacity>
            {contDisponíveis.includes(1) && (
              <TouchableOpacity
                style={[hStyles.filterBtn, continuacaoFiltro === '1' && hStyles.filterBtnActive]}
                onPress={() => setContinuacaoFiltro('1')}
              >
                <Text style={[hStyles.filterBtnText, continuacaoFiltro === '1' && { color: '#fff' }]}>1ª</Text>
              </TouchableOpacity>
            )}
            {contDisponíveis.includes(2) && (
              <TouchableOpacity
                style={[hStyles.filterBtn, continuacaoFiltro === '2' && hStyles.filterBtnActive]}
                onPress={() => setContinuacaoFiltro('2')}
              >
                <Text style={[hStyles.filterBtnText, continuacaoFiltro === '2' && { color: '#fff' }]}>2ª</Text>
              </TouchableOpacity>
            )}
            {contDisponíveis.includes(3) && (
              <TouchableOpacity
                style={[hStyles.filterBtn, continuacaoFiltro === '3' && hStyles.filterBtnActive]}
                onPress={() => setContinuacaoFiltro('3')}
              >
                <Text style={[hStyles.filterBtnText, continuacaoFiltro === '3' && { color: '#fff' }]}>3ª</Text>
              </TouchableOpacity>
            )}
            {contDisponíveis.includes(4) && (
              <TouchableOpacity
                style={[hStyles.filterBtn, continuacaoFiltro === '4' && hStyles.filterBtnActive]}
                onPress={() => setContinuacaoFiltro('4')}
              >
                <Text style={[hStyles.filterBtnText, continuacaoFiltro === '4' && { color: '#fff' }]}>4ª</Text>
              </TouchableOpacity>
            )}
            {contDisponíveis.includes(5) && (
              <TouchableOpacity
                style={[hStyles.filterBtn, continuacaoFiltro === '5' && hStyles.filterBtnActive]}
                onPress={() => setContinuacaoFiltro('5')}
              >
                <Text style={[hStyles.filterBtnText, continuacaoFiltro === '5' && { color: '#fff' }]}>5ª</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TextInput
          style={hStyles.searchInput}
          placeholder="🔍 Buscar membro..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />

        <View style={hStyles.card}>
          {tipoMembro !== 'visitantes' && filteredMembers.map(m => (
            <TouchableOpacity
              key={m.id}
              style={hStyles.presencaItem}
              onPress={() => togglePresenca(m.id)}
            >
              <View style={[hStyles.avatar, { backgroundColor: avatarColor(m.nome) }]}>
                <Text style={hStyles.avatarText}>{initials(m.nome)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={hStyles.presencaMemberName}>{m.nome}</Text>
                <Text style={hStyles.presencaMemberDetail}>{gLabel(m)} • {contLabel(m)}</Text>
              </View>
              <View style={[hStyles.checkbox, presenca[m.id] && hStyles.checkboxChecked]}>
                {presenca[m.id] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}

          {(tipoMembro === 'visitantes' || tipoMembro === 'comum_visitantes') && (
            <>
              {presVisitantes.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={hStyles.presencaItem}
                  onPress={() => togglePresenca(v.id)}
                >
                  <Text style={hStyles.visitanteIcon}>👤</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={hStyles.presencaMemberName}>{v.comum}</Text>
                    <Text style={hStyles.presencaMemberDetail}>Visitante</Text>
                  </View>
                  <View style={[hStyles.checkbox, presenca[v.id] && hStyles.checkboxChecked]}>
                    {presenca[v.id] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
                  </View>
                  <TouchableOpacity onPress={() => excluirVisitante(v.id)} style={hStyles.deleteBtn}>
                    <Text style={{ color: '#ef4444', fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {!showAddVisitante && (
                <TouchableOpacity style={hStyles.addVisitanteBtn} onPress={() => setShowAddVisitante(true)}>
                  <Text style={hStyles.addVisitanteBtnText}>➕ Adicionar Visitante</Text>
                </TouchableOpacity>
              )}
              {showAddVisitante && (
                <View style={hStyles.addVisitanteForm}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#4f46e5', marginBottom: 8 }}>👤 Novo Visitante</Text>
                  <Text style={hStyles.label}>Qual a comum?</Text>
                  <TextInput
                    style={hStyles.visitanteInput}
                    placeholder="Nome da comum..."
                    value={novaComum}
                    onChangeText={setNovaComum}
                    placeholderTextColor="#94a3b8"
                    autoFocus
                  />
                  <TouchableOpacity style={hStyles.btnSmPrimary} onPress={adicionarVisitante}>
                    <Text style={hStyles.btnSmPrimaryText}>✅ Adicionar Visitante</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <View style={hStyles.buttonRow}>
          <TouchableOpacity style={hStyles.btnPrimary} onPress={salvar}>
            <Text style={hStyles.btnPrimaryText}>💾 Salvar Presença</Text>
          </TouchableOpacity>
          <TouchableOpacity style={hStyles.btnSecondary} onPress={limpar}>
            <Text style={hStyles.btnSecondaryText}>🗑 Limpar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Função para obter continuações disponíveis por grupo ───────────────────
function getContsByGroup(grupo: 'todos' | 'irmaos' | 'irmas' | 'mocidade' | 'criancas'): number[] {
  switch (grupo) {
    case 'irmaos': return [1, 2, 3];
    case 'irmas': return [1, 2, 3, 4, 5];
    case 'mocidade': return [3, 4, 5];
    case 'criancas': return [1, 2];
    case 'todos': return [1, 2, 3, 4, 5];
    default: return [];
  }
}

// ─── Função para filtrar membros por grupo e continuação ───────────────────
function filterMembersByGroup(members: Member[], grupo: 'todos' | 'irmaos' | 'irmas' | 'mocidade' | 'criancas', continuacao: string): Member[] {
  if (grupo === 'todos') return members;

  let filtered = members;

  if (grupo === 'irmaos') {
    filtered = filtered.filter(m => m.genero === 'M' && [1, 2, 3].includes(m.continuacao));
  } else if (grupo === 'irmas') {
    filtered = filtered.filter(m => m.genero === 'F' && [1, 2, 3, 4, 5].includes(m.continuacao));
  } else if (grupo === 'mocidade') {
    filtered = filtered.filter(m => {
      if (m.genero === 'M') return m.continuacao === 3;
      return [3, 4, 5].includes(m.continuacao);
    });
  } else if (grupo === 'criancas') {
    filtered = filtered.filter(m => [1, 2].includes(m.continuacao));
  }

  if (continuacao && continuacao !== 'todas') {
    const cont = parseInt(continuacao);
    filtered = filtered.filter(m => m.continuacao === cont);
  }

  return filtered;
}

// ─── Main Histórico Screen ─────────────────────────────────────────────────────
export default function HistoricoScreen() {
  const { meetings, members, autenticado, showToast, saveMeetings, checkAndNotifyAbsences } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  // ─── Filtros ───────────────────────────────────────────────────────────────
  const [ano, setAno] = useState<string>(String(new Date().getFullYear()));
  const [tipoIntervalo, setTipoIntervalo] = useState<'todas' | 'semestre' | 'trimestre' | 'bimestre' | 'custom'>('todas');
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('');
  const [dataIni, setDataIni] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  
  // Filtros de Membros (Grupo, Continuação)
  const [grupoMembros, setGrupoMembros] = useState<'todos' | 'irmaos' | 'irmas' | 'mocidade' | 'criancas'>('todos');
  const [continuacao, setContinuacao] = useState<string>('todas');
  
  // Tipo de Membro (Comum, Comum+Visitantes, Visitantes)
  const [tipoMembro, setTipoMembro] = useState<'comum' | 'comum_visitantes' | 'visitantes'>('comum');
  
  // Gráfico
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [showChart, setShowChart] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!autenticado) setShowLogin(true);
    // Lançar automaticamente a próxima reunião de domingo
    ensureNextSundayMeeting();
    // Verificar e notificar membros com 3 faltas consecutivas
    checkAndNotifyAbsences();
  }, [autenticado, checkAndNotifyAbsences]));

  async function ensureNextSundayMeeting() {
    const sundayDate = getNextSundayDate();
    const hasSundayMeeting = meetings.some(m => m.date === sundayDate);
    if (!hasSundayMeeting) {
      const newMeeting = {
        id: `sched_${sundayDate}`,
        date: sundayDate,
        present: [],
        isScheduled: true,
      };
      await saveMeetings([...meetings, newMeeting]);
    }
  }

  // Gerar lista de anos disponíveis
  const yearsAvailable = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return String(y);
  });

  // Obter opções de período baseado no tipo
  const periodosDisponiveis = (tipoIntervalo === 'semestre' || tipoIntervalo === 'trimestre' || tipoIntervalo === 'bimestre')
    ? PERIODOS_MAP[tipoIntervalo] || []
    : [];

  // Obter continuações disponíveis para o grupo selecionado
  const contDisponíveis = getContsByGroup(grupoMembros);

  // Calcular intervalo de datas
  function getDateRange(): [string, string] {
    if (tipoIntervalo === 'todas') return ['', ''];
    if (tipoIntervalo === 'custom') return [dataIni, dataFim];
    if (!ano || ano === 'todas') return ['', ''];
    if (tipoIntervalo === 'semestre' || tipoIntervalo === 'trimestre' || tipoIntervalo === 'bimestre') {
      const [ini, fim] = getDateRangeFromPeriod(ano, tipoIntervalo, periodoSelecionado);
      return [ini, fim];
    }
    return ['', ''];
  }

  const [dateIni, dateFim] = getDateRange();

  // Filtrar reuniões
  let filteredMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date));
  if (dateIni) filteredMeetings = filteredMeetings.filter(m => m.date >= dateIni);
  if (dateFim) filteredMeetings = filteredMeetings.filter(m => m.date <= dateFim);

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

  if (selectedMeetingId) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <PresencaScreen meetingId={selectedMeetingId} onBack={() => setSelectedMeetingId(null)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={hStyles.header}><Text style={hStyles.headerTitle}>📅 Histórico</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* FILTRO CARD */}
        <View style={hStyles.card}>
          <Text style={hStyles.cardTitle}>🔍 Filtros</Text>

          {/* Ano */}
          <Text style={hStyles.label}>Ano</Text>
          <View style={hStyles.pickerContainer}>
            <Picker
              selectedValue={ano}
              onValueChange={setAno}
              style={hStyles.picker}
            >
              {yearsAvailable.map(y => (
                <Picker.Item key={y} label={y} value={y} />
              ))}
            </Picker>
          </View>

          {/* Tipo de Intervalo */}
          <Text style={hStyles.label}>Intervalo</Text>
          <View style={hStyles.pickerContainer}>
            <Picker
              selectedValue={tipoIntervalo}
              onValueChange={(value: any) => { setTipoIntervalo(value); setPeriodoSelecionado(''); }}
              style={hStyles.picker}
            >
              <Picker.Item label="Todas as reuniões" value="todas" />
              <Picker.Item label="Semestre" value="semestre" />
              <Picker.Item label="Trimestre" value="trimestre" />
              <Picker.Item label="Bimestre" value="bimestre" />
              <Picker.Item label="Personalizado" value="custom" />
            </Picker>
          </View>

          {/* Período (se semestre/trimestre/bimestre) */}
          {periodosDisponiveis.length > 0 && (
            <>
              <Text style={hStyles.label}>{tipoIntervalo.charAt(0).toUpperCase() + tipoIntervalo.slice(1)}</Text>
              <View style={hStyles.pickerContainer}>
                <Picker
                  selectedValue={periodoSelecionado}
                  onValueChange={setPeriodoSelecionado}
                  style={hStyles.picker}
                >
                  <Picker.Item label={`Selecionar ${tipoIntervalo}...`} value="" />
                  {periodosDisponiveis.map(p => (
                    <Picker.Item key={p.value} label={p.label} value={p.value} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* Datas personalizadas (se custom) */}
          {tipoIntervalo === 'custom' && (
            <>
              <Text style={hStyles.label}>De</Text>
              <TextInput
                style={hStyles.input}
                placeholder="YYYY-MM-DD"
                value={dataIni}
                onChangeText={setDataIni}
                placeholderTextColor="#94a3b8"
              />
              <Text style={hStyles.label}>Até</Text>
              <TextInput
                style={hStyles.input}
                placeholder="YYYY-MM-DD"
                value={dataFim}
                onChangeText={setDataFim}
                placeholderTextColor="#94a3b8"
              />
            </>
          )}

          {/* Divider */}
          <View style={hStyles.divider} />

          {/* Grupo de Membros */}
          <Text style={hStyles.label}>Grupo de Membros</Text>
          <View style={hStyles.pickerContainer}>
            <Picker
              selectedValue={grupoMembros}
              onValueChange={(value: any) => { setGrupoMembros(value); setContinuacao('todas'); }}
              style={hStyles.picker}
            >
              <Picker.Item label="👥 Todos" value="todos" />
              <Picker.Item label="👨 Irmãos" value="irmaos" />
              <Picker.Item label="👩 Irmãs" value="irmas" />
              <Picker.Item label="🧑‍🤝‍🧑 Mocidade" value="mocidade" />
              <Picker.Item label="👧🧒 Crianças" value="criancas" />
            </Picker>
          </View>

          {/* Continuação (dinâmica por grupo) */}
          {grupoMembros !== 'todos' && (
            <>
              <Text style={hStyles.label}>Continuação</Text>
              <View style={hStyles.pickerContainer}>
                <Picker
                  selectedValue={continuacao}
                  onValueChange={setContinuacao}
                  style={hStyles.picker}
                >
                  <Picker.Item label="Todas" value="todas" />
                  {contDisponíveis.includes(1) && <Picker.Item label="1ª Continuação" value="1" />}
                  {contDisponíveis.includes(2) && <Picker.Item label="2ª Continuação" value="2" />}
                  {contDisponíveis.includes(3) && <Picker.Item label="3ª Continuação" value="3" />}
                  {contDisponíveis.includes(4) && <Picker.Item label="4ª Continuação" value="4" />}
                  {contDisponíveis.includes(5) && <Picker.Item label="5ª Continuação" value="5" />}
                </Picker>
              </View>
            </>
          )}

          {/* Tipo de Membro */}
          <Text style={hStyles.label}>Tipo de Membro</Text>
          <View style={hStyles.pickerContainer}>
            <Picker
              selectedValue={tipoMembro}
              onValueChange={setTipoMembro}
              style={hStyles.picker}
            >
              <Picker.Item label="👥 Comum" value="comum" />
              <Picker.Item label="👥+👤 Comum + Visitantes" value="comum_visitantes" />
              <Picker.Item label="👤 Visitantes" value="visitantes" />
            </Picker>
          </View>

          {/* Botões de Ação */}
          <View style={hStyles.filterRow}>
            <TouchableOpacity style={[hStyles.btnSmPrimary, { flex: 1 }]} onPress={() => setShowChart(true)}>
              <Text style={hStyles.btnSmPrimaryText}>📊 Visualizar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de Reuniões */}
        <View style={hStyles.card}>
          <Text style={hStyles.cardTitle}>📅 Reuniões ({filteredMeetings.length})</Text>
          {filteredMeetings.length === 0 ? (
            <View style={hStyles.empty}>
              <Text style={hStyles.emptyText}>Nenhuma reunião no período</Text>
            </View>
          ) : (
            filteredMeetings.map(m => {
              const today = todayISO();
              const isToday = m.date === today;
              const isProxima = m.date > today;
              const presentes = m.present?.length || 0;
              return (
                <TouchableOpacity
                  key={String(m.id || m.date)}
                  style={hStyles.meetingItem}
                  onPress={() => setSelectedMeetingId(String(m.id || m.date))}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={hStyles.meetingDate}>{formatDate(m.date)}</Text>
                    <Text style={hStyles.meetingCount}>👥 {presentes} presentes</Text>
                    {isToday && <Text style={hStyles.tag}>🔔 Hoje</Text>}
                    {isProxima && !isToday && <Text style={[hStyles.tag, { backgroundColor: '#fef3c7', color: '#d97706' }]}>📅 Próxima</Text>}
                  </View>
                  <Text style={hStyles.arrow}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de Gráfico */}
      <Modal visible={showChart} transparent animationType="slide">
        <View style={hStyles.modalOverlay}>
          <View style={hStyles.modalBox}>
            <View style={hStyles.modalHeader}>
              <Text style={hStyles.modalTitle}>📊 Gráfico de Presença</Text>
              <TouchableOpacity onPress={() => setShowChart(false)}>
                <Text style={hStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              <View style={{ padding: 16 }}>
                <View style={hStyles.filterRow}>
                  <TouchableOpacity
                    style={[hStyles.filterBtn, chartType === 'line' && hStyles.filterBtnActive]}
                    onPress={() => setChartType('line')}
                  >
                    <Text style={[hStyles.filterBtnText, chartType === 'line' && { color: '#fff' }]}>📈 Linha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[hStyles.filterBtn, chartType === 'bar' && hStyles.filterBtnActive]}
                    onPress={() => setChartType('bar')}
                  >
                    <Text style={[hStyles.filterBtnText, chartType === 'bar' && { color: '#fff' }]}>📊 Barra</Text>
                  </TouchableOpacity>
                </View>
                <PresencaChart
                  meetings={filteredMeetings}
                  members={filterMembersByGroup(members, grupoMembros, continuacao)}
                  chartType={chartType}
                  title={`Presença no Período`}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LoginModal visible={showLogin} onSuccess={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />
    </ScreenContainer>
  );
}

const hStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 10 },
  pickerContainer: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, backgroundColor: '#f1f5f9', marginBottom: 10, overflow: 'hidden' },
  picker: { color: '#1e293b' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 10 },
  divider: { borderTopWidth: 1, borderTopColor: '#e2e8f0', marginVertical: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  filterBtn: { flex: 1, minWidth: '30%', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, alignItems: 'center', backgroundColor: '#f8fafc' },
  filterBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  btnSmPrimary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  btnSmPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center', flex: 1 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 13, alignItems: 'center', flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0' },
  btnSecondaryText: { color: '#4f46e5', fontWeight: '700', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  meetingItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  meetingDate: { fontWeight: '700', fontSize: 14 },
  meetingCount: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tag: { fontSize: 10, backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, fontWeight: '700', alignSelf: 'flex-start' },
  arrow: { color: '#818cf8', fontSize: 18 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#64748b' },
  presencaContainer: { flex: 1 },
  presencaHeader: { backgroundColor: '#3730a3', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  presencaTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  presencaDate: { color: '#cbd5e1', fontSize: 12, marginTop: 2 },
  backBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  backText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  presencaItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  visitanteIcon: { fontSize: 24, marginRight: 4 },
  presencaMemberName: { fontWeight: '700', fontSize: 14 },
  presencaMemberDetail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  deleteBtn: { padding: 4 },
  addVisitanteBtn: { marginTop: 10, borderWidth: 1.5, borderColor: '#818cf8', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addVisitanteBtnText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  addVisitanteForm: { marginTop: 10, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#e2e8f0', gap: 8 },
  visitanteInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff', color: '#1e293b' },
  searchInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 10 },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
});
