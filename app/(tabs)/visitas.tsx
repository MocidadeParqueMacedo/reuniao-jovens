import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LoginModal } from '@/components/LoginModal';
import { useApp } from '@/lib/app-context';
import { Visita, formatDate, todayISO } from '@/lib/db';

// ─── Modal Nova Visita ─────────────────────────────────────────────────────────
function ModalNovaVisita({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void;
  onSave: (v: Omit<Visita, 'id'>) => void;
}) {
  const { showToast } = useApp();
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');

  function handleSave() {
    if (!nome.trim() || !data) { showToast('Preencha nome e data!'); return; }
    onSave({ nome: nome.trim(), data, horario, endereco: endereco.trim(), obs: obs.trim(), realizada: false });
    setNome(''); setData(''); setHorario(''); setEndereco(''); setObs('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={vStyles.modalOverlay}>
        <View style={vStyles.modalBox}>
          <View style={vStyles.modalHeader}>
            <Text style={vStyles.modalTitle}>🏠 Agendar Visita</Text>
            <TouchableOpacity onPress={onClose}><Text style={vStyles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={vStyles.label}>Nome do(a) visitado(a) *</Text>
            <TextInput style={vStyles.input} value={nome} onChangeText={setNome} placeholder="Nome" placeholderTextColor="#94a3b8" />
            <Text style={vStyles.label}>Data * (AAAA-MM-DD)</Text>
            <TextInput style={vStyles.input} value={data} onChangeText={setData} placeholder="2025-06-15" placeholderTextColor="#94a3b8" keyboardType="numeric" />
            <Text style={vStyles.label}>Horário</Text>
            <TextInput style={vStyles.input} value={horario} onChangeText={setHorario} placeholder="19:00" placeholderTextColor="#94a3b8" />
            <Text style={vStyles.label}>Endereço</Text>
            <TextInput style={vStyles.input} value={endereco} onChangeText={setEndereco} placeholder="Rua, número..." placeholderTextColor="#94a3b8" />
            <Text style={vStyles.label}>Observações</Text>
            <TextInput style={[vStyles.input, { height: 70 }]} value={obs} onChangeText={setObs} placeholder="Observações..." placeholderTextColor="#94a3b8" multiline />
            <TouchableOpacity style={vStyles.btnPrimary} onPress={handleSave}>
              <Text style={vStyles.btnPrimaryText}>💾 Salvar Visita</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Detalhe da Visita ─────────────────────────────────────────────────────────
function VisitaDetalhe({ visita, onBack, onToggle, onDelete }: {
  visita: Visita; onBack: () => void;
  onToggle: (id: number) => void; onDelete: (id: number) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={vStyles.detailHeader}>
        <TouchableOpacity style={vStyles.backBtn} onPress={onBack}>
          <Text style={vStyles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={vStyles.detailTitle}>🏠 Detalhe da Visita</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={vStyles.card}>
          <Text style={vStyles.detailName}>{visita.nome}</Text>
          <Text style={vStyles.detailSub}>📅 {formatDate(visita.data)}</Text>
          {visita.horario ? <Text style={vStyles.detailSub}>⏰ {visita.horario}</Text> : null}
          {visita.endereco ? <Text style={vStyles.detailSub}>📍 {visita.endereco}</Text> : null}
          {visita.obs ? <Text style={vStyles.detailSub}>📝 {visita.obs}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              style={[vStyles.btnPrimary, { flex: 1, backgroundColor: visita.realizada ? '#22c55e' : '#4f46e5' }]}
              onPress={() => onToggle(visita.id)}
            >
              <Text style={vStyles.btnPrimaryText}>{visita.realizada ? '✅ Realizada' : '⬜ Marcar como Realizada'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[vStyles.btnDanger, { marginTop: 10 }]} onPress={() => onDelete(visita.id)}>
            <Text style={vStyles.btnPrimaryText}>🗑 Excluir Visita</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function VisitasScreen() {
  const { visitas, visitasComuns, saveVisitas, saveVisitasComuns, autenticado, showToast } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'agendar' | 'historico' | 'comuns' | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [novaComum, setNovaComum] = useState('');

  useFocusEffect(useCallback(() => {
    if (!autenticado) setShowLogin(true);
  }, [autenticado]));

  async function handleSave(data: Omit<Visita, 'id'>) {
    const nova: Visita = { ...data, id: Date.now() };
    await saveVisitas([...visitas, nova]);
    showToast('✅ Visita agendada!');
  }

  async function handleToggle(id: number) {
    const updated = visitas.map(v => v.id === id ? { ...v, realizada: !v.realizada } : v);
    await saveVisitas(updated);
    const v = updated.find(v => v.id === id);
    if (selectedVisita) setSelectedVisita(v || null);
    showToast(v?.realizada ? '✅ Marcada como realizada' : '⬜ Desmarcada');
  }

  async function handleDelete(id: number) {
    Alert.alert('Excluir Visita', 'Deseja excluir esta visita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await saveVisitas(visitas.filter(v => v.id !== id));
          setSelectedVisita(null);
          showToast('🗑 Visita removida');
        },
      },
    ]);
  }

  async function adicionarComum() {
    if (!novaComum.trim()) return;
    await saveVisitasComuns([...visitasComuns, novaComum.trim()]);
    setNovaComum('');
    showToast('✅ Comum adicionada!');
  }

  async function toggleComum(comum: string) {
    if (visitasComuns.includes(comum)) {
      await saveVisitasComuns(visitasComuns.filter(c => c !== comum));
    } else {
      await saveVisitasComuns([...visitasComuns, comum]);
    }
  }

  async function removerComum(comum: string) {
    await saveVisitasComuns(visitasComuns.filter(c => c !== comum));
  }

  if (!autenticado) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={vStyles.lockedContainer}>
          <Text style={vStyles.lockedIcon}>🔐</Text>
          <Text style={vStyles.lockedText}>Esta seção requer autenticação</Text>
          <TouchableOpacity style={vStyles.btnPrimary} onPress={() => setShowLogin(true)}>
            <Text style={vStyles.btnPrimaryText}>🔓 Entrar</Text>
          </TouchableOpacity>
        </View>
        <LoginModal visible={showLogin} onSuccess={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />
      </ScreenContainer>
    );
  }

  if (selectedVisita) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={vStyles.header}><Text style={vStyles.headerTitle}>🏠 Visitas</Text></View>
        <VisitaDetalhe
          visita={selectedVisita}
          onBack={() => setSelectedVisita(null)}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </ScreenContainer>
    );
  }

  const today = todayISO();
  const upcoming = visitas.filter(v => v.data >= today && !v.realizada).sort((a, b) => a.data.localeCompare(b.data));
  const past = visitas.filter(v => v.data < today || v.realizada).sort((a, b) => b.data.localeCompare(a.data));

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={vStyles.header}><Text style={vStyles.headerTitle}>🏠 Visitas</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Menu */}
        {!activeMenu && (
          <View style={vStyles.menuGrid}>
            <TouchableOpacity style={vStyles.menuCard} onPress={() => { setActiveMenu('agendar'); setShowModal(true); }}>
              <Text style={vStyles.menuIcon}>📅</Text>
              <Text style={vStyles.menuLabel}>Agendar Visita</Text>
            </TouchableOpacity>
            <TouchableOpacity style={vStyles.menuCard} onPress={() => setActiveMenu('historico')}>
              <Text style={vStyles.menuIcon}>📋</Text>
              <Text style={vStyles.menuLabel}>Histórico</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[vStyles.menuCard, vStyles.menuCardFull]} onPress={() => setActiveMenu('comuns')}>
              <Text style={vStyles.menuIcon}>✅</Text>
              <Text style={vStyles.menuLabel}>Para Comuns</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Histórico */}
        {activeMenu === 'historico' && (
          <>
            <View style={vStyles.submenuHeader}>
              <TouchableOpacity style={vStyles.backBtn} onPress={() => setActiveMenu(null)}>
                <Text style={vStyles.backText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={vStyles.submenuTitle}>📋 Histórico de Visitas</Text>
            </View>
            <TouchableOpacity style={[vStyles.btnPrimary, { marginBottom: 12 }]} onPress={() => setShowModal(true)}>
              <Text style={vStyles.btnPrimaryText}>+ Agendar Nova Visita</Text>
            </TouchableOpacity>
            {upcoming.length > 0 && (
              <View style={vStyles.card}>
                <Text style={vStyles.cardTitle}>⏳ Próximas</Text>
                {upcoming.map(v => (
                  <TouchableOpacity key={v.id} style={vStyles.visitaItem} onPress={() => setSelectedVisita(v)}>
                    <View style={{ flex: 1 }}>
                      <Text style={vStyles.visitaNome}>🏠 {v.nome}</Text>
                      <Text style={vStyles.visitaSub}>📅 {formatDate(v.data)}{v.horario ? ` · ⏰ ${v.horario}` : ''}</Text>
                      {v.endereco ? <Text style={vStyles.visitaSub}>📍 {v.endereco}</Text> : null}
                    </View>
                    <Text style={{ color: '#818cf8', fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {past.length > 0 && (
              <View style={vStyles.card}>
                <Text style={vStyles.cardTitle}>✅ Realizadas / Passadas</Text>
                {past.map(v => (
                  <TouchableOpacity key={v.id} style={vStyles.visitaItem} onPress={() => setSelectedVisita(v)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[vStyles.visitaNome, v.realizada && { color: '#22c55e' }]}>
                        {v.realizada ? '✅' : '🏠'} {v.nome}
                      </Text>
                      <Text style={vStyles.visitaSub}>📅 {formatDate(v.data)}</Text>
                    </View>
                    <Text style={{ color: '#818cf8', fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {upcoming.length === 0 && past.length === 0 && (
              <View style={vStyles.card}>
                <View style={vStyles.empty}>
                  <Text style={vStyles.emptyIcon}>🏠</Text>
                  <Text style={vStyles.emptyText}>Nenhuma visita registrada</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Para Comuns */}
        {activeMenu === 'comuns' && (
          <>
            <View style={vStyles.submenuHeader}>
              <TouchableOpacity style={vStyles.backBtn} onPress={() => setActiveMenu(null)}>
                <Text style={vStyles.backText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={vStyles.submenuTitle}>✅ Para Comuns</Text>
            </View>
            <View style={vStyles.card}>
              <Text style={vStyles.cardTitle}>📋 Comuns a Visitar</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  style={[vStyles.input, { flex: 1 }]}
                  value={novaComum}
                  onChangeText={setNovaComum}
                  placeholder="Nome da comum..."
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity style={vStyles.btnSmPrimary} onPress={adicionarComum}>
                  <Text style={vStyles.btnSmPrimaryText}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>
              {visitasComuns.length === 0 ? (
                <View style={vStyles.empty}>
                  <Text style={vStyles.emptyIcon}>✅</Text>
                  <Text style={vStyles.emptyText}>Nenhuma comum na lista</Text>
                </View>
              ) : (
                visitasComuns.map((comum, i) => (
                  <View key={i} style={vStyles.comunsItem}>
                    <TouchableOpacity style={[vStyles.checkbox]} onPress={() => toggleComum(comum)}>
                      <Text style={{ fontSize: 16 }}>{visitasComuns.includes(comum) ? '☑️' : '⬜'}</Text>
                    </TouchableOpacity>
                    <Text style={{ flex: 1, fontSize: 14, color: '#1e293b' }}>{comum}</Text>
                    <TouchableOpacity onPress={() => removerComum(comum)}>
                      <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <ModalNovaVisita
        visible={showModal}
        onClose={() => { setShowModal(false); if (activeMenu === 'agendar') setActiveMenu(null); }}
        onSave={handleSave}
      />
      <LoginModal visible={showLogin} onSuccess={() => setShowLogin(false)} onCancel={() => setShowLogin(false)} />
    </ScreenContainer>
  );
}

const vStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5', marginBottom: 10 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  menuCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    borderWidth: 2, borderColor: 'transparent',
  },
  menuCardFull: { width: '100%' },
  menuIcon: { fontSize: 28, marginBottom: 6 },
  menuLabel: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  submenuHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  backText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  submenuTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  visitaItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  visitaNome: { fontWeight: '700', fontSize: 14 },
  visitaSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  comunsItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  checkbox: { padding: 2 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  detailHeader: { backgroundColor: '#3730a3', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  detailName: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  detailSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 4 },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 8 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDanger: { backgroundColor: '#ef4444', borderRadius: 10, padding: 13, alignItems: 'center' },
  btnSmPrimary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  btnSmPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
