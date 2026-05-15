import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { Ata, formatDate } from '@/lib/db';

// ─── Modal Nova Ata ────────────────────────────────────────────────────────────
function ModalNovaAta({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void;
  onSave: (a: Omit<Ata, 'id' | 'criadaEm'>) => void;
}) {
  const { members, showToast } = useApp();
  const auxiliares = members.filter(m => m.auxiliar);
  const [data, setData] = useState('');
  const [auxSel, setAuxSel] = useState<number[]>([]);
  const [tab, setTab] = useState<'texto' | 'foto'>('texto');
  const [texto, setTexto] = useState('');
  const [fotoData, setFotoData] = useState<string | null>(null);

  async function pickFoto(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showToast('Permissão negada'); return; }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFotoData(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  }

  function toggleAux(id: number) {
    setAuxSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!data) { showToast('Selecione a data da reunião!'); return; }
    if (tab === 'texto' && !texto.trim()) { showToast('Preencha o assunto!'); return; }
    if (tab === 'foto' && !fotoData) { showToast('Tire ou selecione uma foto!'); return; }
    const assunto = tab === 'texto'
      ? { tipo: 'texto' as const, conteudo: texto.trim() }
      : { tipo: 'foto' as const, conteudo: fotoData! };
    onSave({ data, auxiliares: auxSel, assunto });
    setData(''); setAuxSel([]); setTab('texto'); setTexto(''); setFotoData(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={atStyles.modalOverlay}>
        <View style={atStyles.modalBox}>
          <View style={atStyles.modalHeader}>
            <Text style={atStyles.modalTitle}>📋 Nova Ata</Text>
            <TouchableOpacity onPress={onClose}><Text style={atStyles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={atStyles.label}>📅 Data da Reunião * (AAAA-MM-DD)</Text>
            <TextInput style={atStyles.input} value={data} onChangeText={setData} placeholder="2025-06-15" placeholderTextColor="#94a3b8" keyboardType="numeric" />

            {auxiliares.length > 0 && (
              <>
                <Text style={atStyles.label}>⭐ Auxiliares Presentes</Text>
                {auxiliares.map(m => (
                  <TouchableOpacity key={m.id} style={atStyles.auxItem} onPress={() => toggleAux(m.id)}>
                    <View style={[atStyles.checkbox, auxSel.includes(m.id) && atStyles.checkboxChecked]}>
                      {auxSel.includes(m.id) && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={atStyles.auxName}>{m.nome}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={atStyles.label}>📝 Assunto</Text>
            <View style={atStyles.tabRow}>
              {[{ v: 'texto' as const, l: '✏️ Texto' }, { v: 'foto' as const, l: '📷 Foto' }].map(({ v, l }) => (
                <TouchableOpacity
                  key={v}
                  style={[atStyles.tabBtn, tab === v && atStyles.tabBtnActive]}
                  onPress={() => setTab(v)}
                >
                  <Text style={[atStyles.tabBtnText, tab === v && { color: '#fff' }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'texto' && (
              <TextInput
                style={[atStyles.input, { height: 100 }]}
                value={texto}
                onChangeText={setTexto}
                placeholder="Descreva o assunto da reunião..."
                placeholderTextColor="#94a3b8"
                multiline
              />
            )}
            {tab === 'foto' && (
              <View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity style={atStyles.photoBtn} onPress={() => pickFoto(false)}>
                    <Text style={atStyles.photoBtnText}>🖼 Galeria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={atStyles.photoBtn} onPress={() => pickFoto(true)}>
                    <Text style={atStyles.photoBtnText}>📷 Câmera</Text>
                  </TouchableOpacity>
                </View>
                {fotoData && (
                  <View>
                    <Image source={{ uri: fotoData }} style={{ width: '100%', height: 200, borderRadius: 9, marginBottom: 8 }} resizeMode="contain" />
                    <TouchableOpacity onPress={() => setFotoData(null)}>
                      <Text style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>🗑 Remover foto</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={atStyles.btnPrimary} onPress={handleSave}>
              <Text style={atStyles.btnPrimaryText}>💾 Salvar Ata</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal Detalhe Ata ─────────────────────────────────────────────────────────
function ModalAtaDetalhe({ ata, members, onClose }: { ata: Ata | null; members: any[]; onClose: () => void }) {
  if (!ata) return null;
  const auxNomes = ata.auxiliares.map(id => members.find(m => m.id === id)?.nome).filter(Boolean);
  return (
    <Modal visible={!!ata} transparent animationType="slide">
      <View style={atStyles.modalOverlay}>
        <View style={atStyles.modalBox}>
          <View style={atStyles.modalHeader}>
            <Text style={atStyles.modalTitle}>📋 Detalhe da Ata</Text>
            <TouchableOpacity onPress={onClose}><Text style={atStyles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={atStyles.label}>📅 Data da Reunião</Text>
            <View style={atStyles.infoBox}><Text style={atStyles.infoText}>{formatDate(ata.data)}</Text></View>
            <Text style={atStyles.label}>⭐ Auxiliares Presentes</Text>
            <View style={atStyles.infoBox}>
              {auxNomes.length > 0
                ? auxNomes.map((n, i) => (
                    <Text key={i} style={atStyles.auxBadge}>{n}</Text>
                  ))
                : <Text style={{ color: '#64748b' }}>Nenhum</Text>
              }
            </View>
            <Text style={atStyles.label}>📝 Assunto</Text>
            {ata.assunto.tipo === 'texto' && (
              <View style={atStyles.infoBox}>
                <Text style={{ fontSize: 14, color: '#1e293b', lineHeight: 20 }}>{ata.assunto.conteudo}</Text>
              </View>
            )}
            {ata.assunto.tipo === 'foto' && (
              <Image source={{ uri: ata.assunto.conteudo }} style={{ width: '100%', height: 300, borderRadius: 9 }} resizeMode="contain" />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AtasScreen() {
  const { atas, members, saveAtas, autenticado, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedAta, setSelectedAta] = useState<Ata | null>(null);

  useFocusEffect(useCallback(() => {
    if (!autenticado) setShowLogin(true);
  }, [autenticado]));

  async function handleSave(data: Omit<Ata, 'id' | 'criadaEm'>) {
    const nova: Ata = { ...data, id: Date.now(), criadaEm: new Date().toISOString() };
    await saveAtas([...atas, nova]);
    showToast('✅ Ata salva!');
  }

  async function handleDelete(id: number) {
    Alert.alert('Excluir Ata', 'Deseja excluir esta ata?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await saveAtas(atas.filter(a => a.id !== id));
          showToast('🗑 Ata removida');
        },
      },
    ]);
  }

  if (!autenticado) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={atStyles.lockedContainer}>
          <Text style={atStyles.lockedIcon}>🔐</Text>
          <Text style={atStyles.lockedText}>Esta seção requer autenticação</Text>
          <TouchableOpacity style={atStyles.btnPrimary} onPress={() => setShowLogin(true)}>
            <Text style={atStyles.btnPrimaryText}>🔓 Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const sortedAtas = [...atas].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={atStyles.header}><Text style={atStyles.headerTitle}>📋 Atas</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={atStyles.card}>
          <View style={atStyles.cardHeaderRow}>
            <Text style={atStyles.cardTitle}>📋 Atas de Reunião</Text>
            <TouchableOpacity style={atStyles.btnSmPrimary} onPress={() => setShowModal(true)}>
              <Text style={atStyles.btnSmPrimaryText}>+ Nova Ata</Text>
            </TouchableOpacity>
          </View>
          {sortedAtas.length === 0 ? (
            <View style={atStyles.empty}>
              <Text style={atStyles.emptyIcon}>📋</Text>
              <Text style={atStyles.emptyText}>Nenhuma ata registrada ainda</Text>
            </View>
          ) : (
            sortedAtas.map(ata => {
              const auxNomes = ata.auxiliares.map(id => members.find(m => m.id === id)?.nome?.split(' ')[0]).filter(Boolean).join(', ') || '—';
              const tipoIcon = ata.assunto.tipo === 'texto' ? '✏️' : '📷';
              const resumo = ata.assunto.tipo === 'texto'
                ? ata.assunto.conteudo.substring(0, 60) + (ata.assunto.conteudo.length > 60 ? '…' : '')
                : 'Foto anexada';
              return (
                <TouchableOpacity key={ata.id} style={atStyles.ataItem} onPress={() => setSelectedAta(ata)}>
                  <View style={{ flex: 1 }}>
                    <Text style={atStyles.ataTitle}>⛪ Reunião de {formatDate(ata.data)}</Text>
                    <Text style={atStyles.ataSub}>⭐ {auxNomes}</Text>
                    <Text style={atStyles.ataSub}>{tipoIcon} Assunto: {resumo}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity onPress={() => handleDelete(ata.id)} style={{ padding: 4 }}>
                      <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#818cf8', fontSize: 18 }}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <ModalNovaAta visible={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
      <ModalAtaDetalhe ata={selectedAta} members={members} onClose={() => setSelectedAta(null)} />
    </ScreenContainer>
  );
}

const atStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  ataItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  ataTitle: { fontWeight: '700', fontSize: 14 },
  ataSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 4 },
  auxItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  auxName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#818cf8', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 9, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
  tabBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  photoBtn: { flex: 1, borderWidth: 1.5, borderColor: '#818cf8', borderRadius: 8, padding: 10, alignItems: 'center' },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSmPrimary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  btnSmPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoBox: { backgroundColor: '#f1f5f9', borderRadius: 9, padding: 12, marginBottom: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoText: { fontSize: 14, color: '#1e293b' },
  auxBadge: { backgroundColor: '#fef3c7', color: '#d97706', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2, fontWeight: '700', fontSize: 13 },
});
