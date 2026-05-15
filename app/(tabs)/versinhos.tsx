import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { Versinho, Member, formatDate } from '@/lib/db';

const LIVROS_BIBLIA = [
  'Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute',
  '1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias',
  'Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias',
  'Lamentações','Ezequiel','Daniel','Oséias','Joel','Amós','Obadias','Jonas','Miquéias',
  'Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias',
  'Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios',
  'Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses',
  '1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro',
  '1 João','2 João','3 João','Judas','Apocalipse',
];

// ─── Modal Novo Versinho ───────────────────────────────────────────────────────
function ModalNovoVersinho({ visible, onClose, onSave }: {
  visible: boolean; onClose: () => void;
  onSave: (v: Omit<Versinho, 'id'>) => void;
}) {
  const { members, showToast } = useApp();
  const [data, setData] = useState('');
  const [livro, setLivro] = useState('');
  const [livroSearch, setLivroSearch] = useState('');
  const [showLivros, setShowLivros] = useState(false);
  const [capitulosText, setCapitulosText] = useState('');
  const [ordemItems, setOrdemItems] = useState<Array<{ membroId: number; versiculosText: string }>>([]);
  const [selectedMembro, setSelectedMembro] = useState<number | null>(null);
  const [showMembroList, setShowMembroList] = useState(false);

  const livrosFiltrados = LIVROS_BIBLIA.filter(l => l.toLowerCase().includes(livroSearch.toLowerCase()));

  function parseNumeros(text: string): number[] {
    return text.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
  }

  function adicionarMembro() {
    if (!selectedMembro) { showToast('Selecione um membro!'); return; }
    if (ordemItems.some(o => o.membroId === selectedMembro)) { showToast('Membro já adicionado!'); return; }
    setOrdemItems(prev => [...prev, { membroId: selectedMembro, versiculosText: '' }]);
    setSelectedMembro(null);
    setShowMembroList(false);
  }

  function removerOrdem(membroId: number) {
    setOrdemItems(prev => prev.filter(o => o.membroId !== membroId));
  }

  function updateVersiculos(membroId: number, text: string) {
    setOrdemItems(prev => prev.map(o => o.membroId === membroId ? { ...o, versiculosText: text } : o));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const arr = [...ordemItems];
    [arr[i-1], arr[i]] = [arr[i], arr[i-1]];
    setOrdemItems(arr);
  }

  function moveDown(i: number) {
    if (i === ordemItems.length - 1) return;
    const arr = [...ordemItems];
    [arr[i], arr[i+1]] = [arr[i+1], arr[i]];
    setOrdemItems(arr);
  }

  function handleSave() {
    if (!data) { showToast('Selecione a data!'); return; }
    if (!livro) { showToast('Selecione o livro!'); return; }
    const capitulos = parseNumeros(capitulosText);
    if (capitulos.length === 0) { showToast('Informe os capítulos!'); return; }
    if (ordemItems.length === 0) { showToast('Adicione pelo menos um membro!'); return; }
    const ordem = ordemItems.map(o => ({
      membroId: o.membroId,
      versiculos: parseNumeros(o.versiculosText),
    }));
    onSave({ data, livro, capitulos, ordem });
    setData(''); setLivro(''); setLivroSearch(''); setCapitulosText(''); setOrdemItems([]);
    onClose();
  }

  const membrosSemOrdem = members.filter(m => !ordemItems.some(o => o.membroId === m.id));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={vStyles.modalOverlay}>
        <View style={vStyles.modalBox}>
          <View style={vStyles.modalHeader}>
            <Text style={vStyles.modalTitle}>📖 Novo Versinho</Text>
            <TouchableOpacity onPress={onClose}><Text style={vStyles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={vStyles.label}>📅 Data da Reunião * (AAAA-MM-DD)</Text>
            <TextInput style={vStyles.input} value={data} onChangeText={setData} placeholder="2025-06-15" placeholderTextColor="#94a3b8" keyboardType="numeric" />

            <Text style={vStyles.label}>📚 Livro *</Text>
            <TouchableOpacity style={vStyles.input} onPress={() => setShowLivros(v => !v)}>
              <Text style={{ color: livro ? '#1e293b' : '#94a3b8', fontSize: 14 }}>{livro || 'Selecione o livro...'}</Text>
            </TouchableOpacity>
            {showLivros && (
              <View style={vStyles.livrosDropdown}>
                <TextInput
                  style={vStyles.input}
                  value={livroSearch}
                  onChangeText={setLivroSearch}
                  placeholder="Buscar livro..."
                  placeholderTextColor="#94a3b8"
                />
                <ScrollView style={{ maxHeight: 180 }}>
                  {livrosFiltrados.map(l => (
                    <TouchableOpacity key={l} style={vStyles.livroOpt} onPress={() => { setLivro(l); setShowLivros(false); }}>
                      <Text style={vStyles.livroOptText}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={vStyles.label}>📑 Capítulos (ex: 1, 2, 3)</Text>
            <TextInput style={vStyles.input} value={capitulosText} onChangeText={setCapitulosText} placeholder="1, 2, 3" placeholderTextColor="#94a3b8" />

            <Text style={vStyles.label}>👥 Ordem de Leitura</Text>
            {/* Add member */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                style={[vStyles.input, { flex: 1, justifyContent: 'center' }]}
                onPress={() => setShowMembroList(v => !v)}
              >
                <Text style={{ color: selectedMembro ? '#1e293b' : '#94a3b8', fontSize: 14 }}>
                  {selectedMembro ? members.find(m => m.id === selectedMembro)?.nome || 'Membro' : 'Selecionar membro...'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={vStyles.btnSmPrimary} onPress={adicionarMembro}>
                <Text style={vStyles.btnSmPrimaryText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>
            {showMembroList && (
              <View style={vStyles.livrosDropdown}>
                <ScrollView style={{ maxHeight: 150 }}>
                  {membrosSemOrdem.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={[vStyles.livroOpt, selectedMembro === m.id && { backgroundColor: '#eef2ff' }]}
                      onPress={() => { setSelectedMembro(m.id); setShowMembroList(false); }}
                    >
                      <Text style={vStyles.livroOptText}>{m.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {ordemItems.map((o, i) => {
              const m = members.find(m => m.id === o.membroId);
              return (
                <View key={o.membroId} style={vStyles.ordemItem}>
                  <View style={vStyles.ordemLeft}>
                    <Text style={vStyles.ordemNum}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={vStyles.ordemNome}>{m?.nome || 'Membro'}</Text>
                      <TextInput
                        style={[vStyles.input, { marginTop: 4, marginBottom: 0 }]}
                        value={o.versiculosText}
                        onChangeText={t => updateVersiculos(o.membroId, t)}
                        placeholder="Versículos (ex: 1, 2, 3)"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                  <View style={{ gap: 4 }}>
                    <TouchableOpacity style={vStyles.orderBtn} onPress={() => moveUp(i)}><Text>▲</Text></TouchableOpacity>
                    <TouchableOpacity style={vStyles.orderBtn} onPress={() => moveDown(i)}><Text>▼</Text></TouchableOpacity>
                    <TouchableOpacity style={[vStyles.orderBtn, { borderColor: '#ef4444' }]} onPress={() => removerOrdem(o.membroId)}>
                      <Text style={{ color: '#ef4444' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={vStyles.btnPrimary} onPress={handleSave}>
              <Text style={vStyles.btnPrimaryText}>💾 Salvar Versinho</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Detalhe Versinho ──────────────────────────────────────────────────────────
function VersinhoDetalhe({ v, members, onBack, onDelete }: {
  v: Versinho; members: Member[]; onBack: () => void; onDelete: (id: number) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={vStyles.detailHeader}>
        <TouchableOpacity style={vStyles.backBtn} onPress={onBack}>
          <Text style={vStyles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={vStyles.detailTitle}>📖 Detalhe do Versinho</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={vStyles.card}>
          <Text style={vStyles.detailDate}>📅 {formatDate(v.data)}</Text>
          <Text style={vStyles.detailLivro}>📚 {v.livro}</Text>
          <Text style={vStyles.detailCap}>📑 Capítulos: {v.capitulos.join(', ')}</Text>
          <Text style={[vStyles.label, { marginTop: 12 }]}>👥 Ordem de Leitura</Text>
          {v.ordem.map((o, i) => {
            const m = members.find(m => m.id === o.membroId);
            return (
              <View key={i} style={vStyles.ordemDetalheItem}>
                <View style={vStyles.ordemNumBadge}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{i+1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={vStyles.ordemNome}>{m?.nome || 'Membro'}</Text>
                  {o.versiculos.length > 0 && (
                    <Text style={vStyles.ordemVers}>Versículos: {o.versiculos.join(', ')}</Text>
                  )}
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={[vStyles.btnDanger, { marginTop: 16 }]} onPress={() => onDelete(v.id)}>
            <Text style={vStyles.btnPrimaryText}>🗑 Excluir Versinho</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function VersinhoScreen() {
  const { versinhos, members, saveVersinhos, autenticado, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedVersinho, setSelectedVersinho] = useState<Versinho | null>(null);

  useFocusEffect(useCallback(() => {
    if (!autenticado) setShowLogin(true);
  }, [autenticado]));

  async function handleSave(data: Omit<Versinho, 'id'>) {
    const novo: Versinho = { ...data, id: Date.now() };
    await saveVersinhos([...versinhos, novo]);
    showToast('✅ Versinho salvo!');
  }

  async function handleDelete(id: number) {
    Alert.alert('Excluir Versinho', 'Deseja excluir este versinho?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          await saveVersinhos(versinhos.filter(v => v.id !== id));
          setSelectedVersinho(null);
          showToast('🗑 Versinho removido');
        },
      },
    ]);
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
      </ScreenContainer>
    );
  }

  if (selectedVersinho) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={vStyles.header}><Text style={vStyles.headerTitle}>📖 Versinhos</Text></View>
        <VersinhoDetalhe
          v={selectedVersinho}
          members={members}
          onBack={() => setSelectedVersinho(null)}
          onDelete={handleDelete}
        />
      </ScreenContainer>
    );
  }

  const sorted = [...versinhos].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={vStyles.header}><Text style={vStyles.headerTitle}>📖 Versinhos</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={vStyles.card}>
          <View style={vStyles.cardHeaderRow}>
            <Text style={vStyles.cardTitle}>📖 Recitativos</Text>
            <TouchableOpacity style={vStyles.btnSmPrimary} onPress={() => setShowModal(true)}>
              <Text style={vStyles.btnSmPrimaryText}>+ Novo</Text>
            </TouchableOpacity>
          </View>
          {sorted.length === 0 ? (
            <View style={vStyles.empty}>
              <Text style={vStyles.emptyIcon}>📖</Text>
              <Text style={vStyles.emptyText}>Nenhum versinho registrado</Text>
            </View>
          ) : (
            sorted.map(v => {
              const membrosNomes = v.ordem.map(o => members.find(m => m.id === o.membroId)?.nome?.split(' ')[0]).filter(Boolean).join(', ');
              return (
                <TouchableOpacity key={v.id} style={vStyles.versinhoItem} onPress={() => setSelectedVersinho(v)}>
                  <View style={{ flex: 1 }}>
                    <Text style={vStyles.versinhoTitle}>📚 {v.livro} — Cap. {v.capitulos.join(', ')}</Text>
                    <Text style={vStyles.versinhoSub}>📅 {formatDate(v.data)}</Text>
                    <Text style={vStyles.versinhoSub}>👥 {membrosNomes || '—'}</Text>
                  </View>
                  <Text style={{ color: '#818cf8', fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <ModalNovoVersinho visible={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  versinhoItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  versinhoTitle: { fontWeight: '700', fontSize: 14 },
  versinhoSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  detailHeader: { backgroundColor: '#3730a3', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  detailDate: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  detailLivro: { fontSize: 18, fontWeight: '800', color: '#4f46e5', marginBottom: 4 },
  detailCap: { fontSize: 14, color: '#1e293b', marginBottom: 4 },
  ordemDetalheItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  ordemNumBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
  },
  ordemVers: { fontSize: 12, color: '#64748b', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9,
    padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b', marginBottom: 4,
  },
  livrosDropdown: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9,
    marginBottom: 8, padding: 8,
  },
  livroOpt: { paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  livroOptText: { fontSize: 14, color: '#1e293b' },
  ordemItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  ordemLeft: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  ordemNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#4f46e5',
    textAlign: 'center', lineHeight: 24, color: '#fff', fontWeight: '800', fontSize: 12,
  },
  ordemNome: { fontWeight: '700', fontSize: 14 },
  orderBtn: {
    width: 28, height: 28, borderRadius: 6, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDanger: { backgroundColor: '#ef4444', borderRadius: 10, padding: 13, alignItems: 'center' },
  btnSmPrimary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center' },
  btnSmPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  backBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  backText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
});
