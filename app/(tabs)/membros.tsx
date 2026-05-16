import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, Image, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthModal } from '@/components/AuthModal';
import { useApp } from '@/lib/app-context';
import { Member, avatarColor, initials, genderLabel, contLabel } from '@/lib/db';

// ─── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ m, onEdit, onDelete }: { m: Member; onEdit: (m: Member) => void; onDelete: (id: number) => void }) {
  const color = avatarColor(m.nome);
  const ini = initials(m.nome);
  const contOrd = ['','1ª','2ª','3ª','4ª','5ª'];
  return (
    <View style={mStyles.memberItem}>
      <View style={[mStyles.avatar, { backgroundColor: color }]}>
        {m.foto
          ? <Image source={{ uri: m.foto }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
          : <Text style={mStyles.avatarText}>{ini}</Text>
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={mStyles.memberName}>{m.nome}</Text>
        <Text style={mStyles.memberDetail}>{genderLabel(m)} · {contOrd[m.continuacao] || m.continuacao}ª Cont.</Text>
        {m.nascimento && <Text style={mStyles.memberDetail}>🎂 {m.nascimento.split('-').reverse().join('/')}</Text>}
        {m.tel && <Text style={mStyles.memberDetail}>📱 {m.tel}</Text>}
        {m.auxiliar && <Text style={mStyles.badge}>⭐ Auxiliar</Text>}
      </View>
      <View style={{ gap: 6 }}>
        <TouchableOpacity onPress={() => onEdit(m)} style={mStyles.actionBtn}>
          <Text style={{ fontSize: 14 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(m.id)} style={mStyles.actionBtn}>
          <Text style={{ fontSize: 14 }}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Member Form Modal ─────────────────────────────────────────────────────────
function MemberModal({
  visible, editMember, onClose, onSave,
}: {
  visible: boolean;
  editMember: Member | null;
  onClose: () => void;
  onSave: (m: Omit<Member, 'id'> & { id?: number }) => void;
}) {
  const { showToast } = useApp();
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState<'M' | 'F' | ''>('');
  const [continuacao, setContinuacao] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [tel, setTel] = useState('');
  const [auxiliar, setAuxiliar] = useState(false);
  const [foto, setFoto] = useState<string | undefined>();

  useFocusEffect(useCallback(() => {
    if (editMember) {
      setNome(editMember.nome);
      setGenero(editMember.genero);
      setContinuacao(String(editMember.continuacao));
      setNascimento(editMember.nascimento || '');
      setTel(editMember.tel || '');
      setAuxiliar(editMember.auxiliar || false);
      setFoto(editMember.foto);
    } else {
      setNome(''); setGenero(''); setContinuacao(''); setNascimento('');
      setTel(''); setAuxiliar(false); setFoto(undefined);
    }
  }, [editMember, visible]));

  const contOptions = genero === 'M'
    ? [{ v: '1', l: '1ª Continuação' }, { v: '2', l: '2ª Continuação' }, { v: '3', l: '3ª Continuação' }]
    : genero === 'F'
    ? [{ v: '1', l: '1ª Continuação' }, { v: '2', l: '2ª Continuação' }, { v: '3', l: '3ª Continuação' }, { v: '4', l: '4ª Continuação' }, { v: '5', l: '5ª Continuação' }]
    : [];

  async function pickImage(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast('Permissão negada'); return; }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  }

  function handleSave() {
    if (!nome.trim()) { showToast('Preencha o nome!'); return; }
    if (!genero) { showToast('Selecione o gênero!'); return; }
    if (!continuacao) { showToast('Selecione a continuação!'); return; }
    onSave({
      id: editMember?.id,
      nome: nome.trim(),
      genero,
      continuacao: parseInt(continuacao),
      nascimento: nascimento || undefined,
      tel: tel || undefined,
      auxiliar,
      foto,
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={mStyles.modalOverlay}>
        <View style={mStyles.modalBox}>
          <View style={mStyles.modalHeader}>
            <Text style={mStyles.modalTitle}>{editMember ? '✏️ Editar Membro' : '➕ Novo Membro'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={mStyles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {/* Photo */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={[mStyles.photoCircle, foto && { borderStyle: 'solid' }]}>
                {foto
                  ? <Image source={{ uri: foto }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
                  : <Text style={{ fontSize: 30 }}>📷</Text>
                }
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={mStyles.photoBtn} onPress={() => pickImage(false)}>
                  <Text style={mStyles.photoBtnText}>🖼 Galeria</Text>
                </TouchableOpacity>
                <TouchableOpacity style={mStyles.photoBtn} onPress={() => pickImage(true)}>
                  <Text style={mStyles.photoBtnText}>📷 Câmera</Text>
                </TouchableOpacity>
                {foto && (
                  <TouchableOpacity style={[mStyles.photoBtn, { borderColor: '#ef4444' }]} onPress={() => setFoto(undefined)}>
                    <Text style={[mStyles.photoBtnText, { color: '#ef4444' }]}>🗑 Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={mStyles.label}>Nome *</Text>
            <TextInput style={mStyles.input} value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor="#94a3b8" />

            <Text style={mStyles.label}>Gênero *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {[{ v: 'M' as const, l: '👨 Masculino' }, { v: 'F' as const, l: '👩 Feminino' }].map(({ v, l }) => (
                <TouchableOpacity
                  key={v}
                  style={[mStyles.genderBtn, genero === v && mStyles.genderBtnActive]}
                  onPress={() => { setGenero(v); setContinuacao(''); }}
                >
                  <Text style={[mStyles.genderBtnText, genero === v && { color: '#fff' }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={mStyles.label}>Continuação *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {contOptions.map(({ v, l }) => (
                <TouchableOpacity
                  key={v}
                  style={[mStyles.contBtn, continuacao === v && mStyles.contBtnActive]}
                  onPress={() => setContinuacao(v)}
                >
                  <Text style={[mStyles.contBtnText, continuacao === v && { color: '#fff' }]}>{l}</Text>
                </TouchableOpacity>
              ))}
              {contOptions.length === 0 && <Text style={{ color: '#94a3b8', fontSize: 13 }}>Selecione o gênero primeiro</Text>}
            </View>

            <Text style={mStyles.label}>Data de Nascimento (AAAA-MM-DD)</Text>
            <TextInput style={mStyles.input} value={nascimento} onChangeText={setNascimento} placeholder="2000-01-15" placeholderTextColor="#94a3b8" keyboardType="numeric" />

            <Text style={mStyles.label}>Telefone</Text>
            <TextInput style={mStyles.input} value={tel} onChangeText={setTel} placeholder="(00) 00000-0000" placeholderTextColor="#94a3b8" keyboardType="phone-pad" />

            <TouchableOpacity
              style={[mStyles.checkRow]}
              onPress={() => setAuxiliar(v => !v)}
            >
              <View style={[mStyles.checkbox, auxiliar && mStyles.checkboxChecked]}>
                {auxiliar && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={mStyles.checkLabel}>⭐ Auxiliar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={mStyles.btnPrimary} onPress={handleSave}>
              <Text style={mStyles.btnPrimaryText}>💾 Salvar Membro</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Group List ────────────────────────────────────────────────────────────────
function GroupList({ members, onEdit, onDelete }: { members: Member[]; onEdit: (m: Member) => void; onDelete: (id: number) => void }) {
  if (members.length === 0) {
    return (
      <View style={mStyles.empty}>
        <Text style={mStyles.emptyIcon}>👤</Text>
        <Text style={mStyles.emptyText}>Nenhum membro neste grupo</Text>
      </View>
    );
  }
  return (
    <>
      {members.map(m => <MemberCard key={m.id} m={m} onEdit={onEdit} onDelete={onDelete} />)}
    </>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function MembrosScreen() {
  const { members, saveMembers, autenticado, showToast, setMembers } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showFab, setShowFab] = useState(false);

  useFocusEffect(useCallback(() => {
  }, [autenticado]));

  function openSubmenu(type: string) {
    setActiveMenu(type);
    setActiveSubMenu(null);
  }

  function closeSubmenu() {
    setActiveMenu(null);
    setActiveSubMenu(null);
  }

  function getGroupMembers(type: string, sub?: string): Member[] {
    if (type === 'todos') return members;
    if (type === 'criancas') return members.filter(m => m.continuacao <= 2);
    if (type === 'mocidade') return members.filter(m => (m.genero === 'F' && m.continuacao >= 3) || (m.genero === 'M' && m.continuacao === 3));
    if (type === 'irmaos') {
      if (!sub) return members.filter(m => m.genero === 'M');
      if (sub === 'mocos') return members.filter(m => m.genero === 'M' && m.continuacao === 3);
      if (sub === 'meninos') return members.filter(m => m.genero === 'M' && m.continuacao <= 2);
      const n = parseInt(sub); return members.filter(m => m.genero === 'M' && m.continuacao === n);
    }
    if (type === 'irmas') {
      if (!sub) return members.filter(m => m.genero === 'F');
      if (sub === 'mocas') return members.filter(m => m.genero === 'F' && m.continuacao >= 3);
      if (sub === 'meninas') return members.filter(m => m.genero === 'F' && m.continuacao <= 2);
      const n = parseInt(sub); return members.filter(m => m.genero === 'F' && m.continuacao === n);
    }
    return [];
  }

  const globalResults = globalSearch.trim()
    ? members.filter(m => m.nome.toLowerCase().includes(globalSearch.toLowerCase()))
    : [];

  async function handleSave(data: Omit<Member, 'id'> & { id?: number }) {
    let updated: Member[];
    if (data.id) {
      updated = members.map(m => m.id === data.id ? { ...m, ...data } as Member : m);
      showToast('✅ Membro atualizado!');
    } else {
      const newMember: Member = { ...data, id: Date.now() } as Member;
      updated = [...members, newMember];
      showToast('✅ Membro adicionado!');
    }
    await saveMembers(updated);
    // Sincronizar com outros usuários via WebSocket
    setMembers(updated);
  }

  async function handleDelete(id: number) {
    Alert.alert('Excluir Membro', 'Deseja excluir este membro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          const updated = members.filter(m => m.id !== id);
          await saveMembers(updated);
          // Sincronizar com outros usuários via WebSocket
          setMembers(updated);
          showToast('🗣 Membro removido');
        },
      },
    ]);
  }

  function handleEdit(m: Member) {
    setEditMember(m);
    setShowModal(true);
  }

  function handleAdd() {
    setEditMember(null);
    setShowModal(true);
    setShowFab(false);
  }

  if (!autenticado) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={mStyles.lockedContainer}>
          <Text style={mStyles.lockedIcon}>🔐</Text>
          <Text style={mStyles.lockedText}>Esta seção requer autenticação</Text>
        </View>
      </ScreenContainer>
    );
  }

  const displayMembers = activeMenu ? getGroupMembers(activeMenu, activeSubMenu || undefined) : [];

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={mStyles.header}>
        <Text style={mStyles.headerTitle}>👥 Membros</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Global Search */}
        {!activeMenu && (
          <View style={mStyles.searchWrap}>
            <Text style={mStyles.searchIcon}>🔍</Text>
            <TextInput
              style={mStyles.searchInput}
              placeholder="Buscar em todos os membros..."
              placeholderTextColor="#94a3b8"
              value={globalSearch}
              onChangeText={setGlobalSearch}
            />
          </View>
        )}

        {/* Global search results */}
        {!activeMenu && globalSearch.trim() && (
          <View style={mStyles.card}>
            <Text style={mStyles.cardTitle}>🔍 Resultados ({globalResults.length})</Text>
            <GroupList members={globalResults} onEdit={handleEdit} onDelete={handleDelete} />
          </View>
        )}

        {/* Main Menu */}
        {!activeMenu && !globalSearch.trim() && (
          <View style={mStyles.menuGrid}>
            {[
              { k: 'irmaos', icon: '👨', label: 'Irmãos' },
              { k: 'irmas', icon: '👩', label: 'Irmãs' },
              { k: 'criancas', icon: '👧🧒', label: 'Crianças' },
              { k: 'mocidade', icon: '🧑‍🤝‍🧑', label: 'Mocidade' },
            ].map(({ k, icon, label }) => (
              <TouchableOpacity key={k} style={mStyles.menuCard} onPress={() => openSubmenu(k)}>
                <Text style={mStyles.menuIcon}>{icon}</Text>
                <Text style={mStyles.menuLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[mStyles.menuCard, mStyles.menuCardFull]} onPress={() => openSubmenu('todos')}>
              <Text style={mStyles.menuIcon}>👥</Text>
              <Text style={mStyles.menuLabel}>Todos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submenu */}
        {activeMenu && (
          <View style={mStyles.card}>
            <View style={mStyles.submenuHeader}>
              <TouchableOpacity style={mStyles.backBtn} onPress={closeSubmenu}>
                <Text style={mStyles.backText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={mStyles.submenuTitle}>
                {activeMenu === 'irmaos' ? '👨 Irmãos' : activeMenu === 'irmas' ? '👩 Irmãs' : activeMenu === 'criancas' ? '👧🧒 Crianças' : activeMenu === 'mocidade' ? '🧑‍🤝‍🧑 Mocidade' : '👥 Todos'}
              </Text>
            </View>

            {/* Subgroup options for irmaos/irmas */}
            {activeMenu === 'irmaos' && (
              <View style={mStyles.subgroupGrid}>
                {[
                  { k: '1', l: '1ª Continuação' }, { k: '2', l: '2ª Continuação' },
                  { k: '3', l: '3ª Continuação' }, { k: 'mocos', l: '🧑 Moços' }, { k: 'meninos', l: '🧒 Meninos' },
                ].map(({ k, l }) => (
                  <TouchableOpacity
                    key={k}
                    style={[mStyles.subgroupOpt, activeSubMenu === k && mStyles.subgroupOptActive]}
                    onPress={() => setActiveSubMenu(prev => prev === k ? null : k)}
                  >
                    <Text style={[mStyles.subgroupOptText, activeSubMenu === k && { color: '#4f46e5', fontWeight: '700' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {activeMenu === 'irmas' && (
              <View style={mStyles.subgroupGrid}>
                {[
                  { k: '1', l: '1ª Continuação' }, { k: '2', l: '2ª Continuação' }, { k: '3', l: '3ª Continuação' },
                  { k: '4', l: '4ª Continuação' }, { k: '5', l: '5ª Continuação' },
                  { k: 'mocas', l: '👩 Moças' }, { k: 'meninas', l: '👧 Meninas' },
                ].map(({ k, l }) => (
                  <TouchableOpacity
                    key={k}
                    style={[mStyles.subgroupOpt, activeSubMenu === k && mStyles.subgroupOptActive]}
                    onPress={() => setActiveSubMenu(prev => prev === k ? null : k)}
                  >
                    <Text style={[mStyles.subgroupOptText, activeSubMenu === k && { color: '#4f46e5', fontWeight: '700' }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <GroupList members={displayMembers} onEdit={handleEdit} onDelete={handleDelete} />
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {showFab && (
        <TouchableOpacity
          style={mStyles.fabBackdrop}
          onPress={() => setShowFab(false)}
        />
      )}
      {showFab && (
        <View style={mStyles.fabOption}>
          <TouchableOpacity style={mStyles.fabOptionBtn} onPress={handleAdd}>
            <Text style={mStyles.fabOptionText}>➕ Adicionar novo membro</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={mStyles.fab}
        onPress={() => setShowFab(v => !v)}
      >
        <Text style={mStyles.fabText}>{showFab ? '✕' : '＋'}</Text>
      </TouchableOpacity>

      <MemberModal
        visible={showModal}
        editMember={editMember}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </ScreenContainer>
  );
}

const mStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5', marginBottom: 10 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9,
    backgroundColor: '#fff', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchIcon: { paddingLeft: 10, fontSize: 16 },
  searchInput: { flex: 1, padding: 10, fontSize: 14, color: '#1e293b' },
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
  subgroupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  subgroupOpt: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  subgroupOptActive: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  subgroupOptText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  memberItem: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  memberName: { fontWeight: '700', fontSize: 15 },
  memberDetail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { fontSize: 11, backgroundColor: '#fef3c7', color: '#d97706', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, fontWeight: '600', alignSelf: 'flex-start', marginTop: 4 },
  actionBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  fabBackdrop: { position: 'absolute', inset: 0, zIndex: 140 },
  fabOption: { position: 'absolute', bottom: 90, right: 20, zIndex: 150 },
  fabOptionBtn: {
    backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.13, shadowRadius: 12, elevation: 6,
  },
  fabOptionText: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
  photoCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#818cf8', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', overflow: 'hidden',
  },
  photoBtn: {
    borderWidth: 1.5, borderColor: '#818cf8', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  photoBtnText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9,
    padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 4,
  },
  genderBtn: { flex: 1, padding: 10, borderRadius: 9, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
  genderBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  genderBtnText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  contBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  contBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  contBtnText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#818cf8', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  checkLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
