import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AuthModal } from '@/components/AuthModal';
import { useApp } from '@/lib/app-context';

interface VisitaLocal {
  id: number;
  nome: string;
  endereco?: string;
  data?: string;
  horario?: string;
  obs?: string;
}

export default function VisitasScreen() {
  const { autenticado, showToast } = useApp();
  const [showMenu, setShowMenu] = useState(true);
  const [submenu, setSubmenu] = useState<'comuns' | 'locais' | null>(null);

  // Para Comuns
  const [visitasComuns, setVisitasComuns] = useState<string[]>([]);
  
  // Locais
  const [visitasLocais, setVisitasLocais] = useState<VisitaLocal[]>([]);
  const [visitasLocaisDone, setVisitasLocaisDone] = useState<number[]>([]);
  const [showModalNovaVisita, setShowModalNovaVisita] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formData, setFormData] = useState('');
  const [formHorario, setFormHorario] = useState('');
  const [formObs, setFormObs] = useState('');

  useFocusEffect(useCallback(() => {
  }, [autenticado]));

  function abrirSubmenu(tipo: 'comuns' | 'locais') {
    setShowMenu(false);
    setSubmenu(tipo);
  }

  function fecharSubmenu() {
    setShowMenu(true);
    setSubmenu(null);
  }

  // ─── Para Comuns ───────────────────────────────────────────────────────────
  function toggleVisitaComum(comum: string, checked: boolean) {
    if (checked) {
      if (!visitasComuns.includes(comum)) {
        setVisitasComuns([...visitasComuns, comum]);
      }
    } else {
      setVisitasComuns(visitasComuns.filter(c => c !== comum));
    }
  }

  // ─── Locais ────────────────────────────────────────────────────────────────
  function abrirModalNovaVisita() {
    setEditingId(null);
    setFormNome('');
    setFormEndereco('');
    setFormData('');
    setFormHorario('');
    setFormObs('');
    setShowModalNovaVisita(true);
  }

  function abrirModalEditarVisita(visita: VisitaLocal) {
    setEditingId(visita.id);
    setFormNome(visita.nome);
    setFormEndereco(visita.endereco || '');
    setFormData(visita.data || '');
    setFormHorario(visita.horario || '');
    setFormObs(visita.obs || '');
    setShowModalNovaVisita(true);
  }

  function fecharModalNovaVisita() {
    setShowModalNovaVisita(false);
  }

  function salvarVisitaLocal() {
    if (!formNome.trim()) {
      showToast('Informe o nome do(a) visitado(a)!');
      return;
    }

    if (editingId !== null) {
      // Editar
      setVisitasLocais(visitasLocais.map(v =>
        v.id === editingId
          ? { ...v, nome: formNome, endereco: formEndereco, data: formData, horario: formHorario, obs: formObs }
          : v
      ));
      showToast('✅ Visita atualizada!');
    } else {
      // Novo
      const novaVisita: VisitaLocal = {
        id: Date.now(),
        nome: formNome,
        endereco: formEndereco,
        data: formData,
        horario: formHorario,
        obs: formObs,
      };
      setVisitasLocais([...visitasLocais, novaVisita]);
      showToast('✅ Visita salva!');
    }

    fecharModalNovaVisita();
  }

  function toggleVisitaLocalDone(id: number, checked: boolean) {
    if (checked) {
      if (!visitasLocaisDone.includes(id)) {
        setVisitasLocaisDone([...visitasLocaisDone, id]);
      }
    } else {
      setVisitasLocaisDone(visitasLocaisDone.filter(i => i !== id));
    }
  }

  function deletarVisitaLocal(id: number) {
    Alert.alert('Excluir visita?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        onPress: () => {
          setVisitasLocais(visitasLocais.filter(v => v.id !== id));
          setVisitasLocaisDone(visitasLocaisDone.filter(i => i !== id));
          showToast('🗑 Visita removida');
        },
        style: 'destructive',
      },
    ]);
  }

  if (!autenticado) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
        <View style={vStyles.lockedContainer}>
          <Text style={vStyles.lockedIcon}>🔐</Text>
          <Text style={vStyles.lockedText}>Esta seção requer autenticação</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={vStyles.header}>
        <Text style={vStyles.headerTitle}>🏠 Visitas</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {/* Menu Principal */}
        {showMenu && (
          <View style={vStyles.menuContainer}>
            <TouchableOpacity
              style={vStyles.menuCard}
              onPress={() => abrirSubmenu('comuns')}
            >
              <Text style={vStyles.menuIcon}>🏘</Text>
              <Text style={vStyles.menuLabel}>Para Comuns</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={vStyles.menuCard}
              onPress={() => abrirSubmenu('locais')}
            >
              <Text style={vStyles.menuIcon}>🏠</Text>
              <Text style={vStyles.menuLabel}>Locais</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submenu Para Comuns */}
        {submenu === 'comuns' && (
          <View>
            <View style={vStyles.submenuHeader}>
              <TouchableOpacity onPress={fecharSubmenu} style={vStyles.backBtn}>
                <Text style={vStyles.backText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={vStyles.submenuTitle}>🏘 Para Comuns</Text>
            </View>

            <View style={vStyles.card}>
              <Text style={vStyles.cardTitle}>✅ Marque as comuns já visitadas</Text>
              <View style={vStyles.comunsList}>
                {visitasComuns.length === 0 ? (
                  <View style={vStyles.empty}>
                    <Text style={vStyles.emptyText}>Nenhuma comum registrada ainda</Text>
                  </View>
                ) : (
                  visitasComuns.map((comum, idx) => (
                    <View key={idx} style={vStyles.comunItem}>
                      <Text style={vStyles.comunName}>{comum}</Text>
                      <Switch
                        value={visitasComuns.includes(comum)}
                        onValueChange={(checked) => toggleVisitaComum(comum, checked)}
                      />
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}

        {/* Submenu Locais */}
        {submenu === 'locais' && (
          <View>
            <View style={[vStyles.submenuHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={fecharSubmenu} style={vStyles.backBtn}>
                  <Text style={vStyles.backText}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={vStyles.submenuTitle}>🏠 Locais</Text>
              </View>
              <TouchableOpacity style={vStyles.btnSmPrimary} onPress={abrirModalNovaVisita}>
                <Text style={vStyles.btnSmPrimaryText}>+ Nova</Text>
              </TouchableOpacity>
            </View>

            <View style={vStyles.card}>
              <Text style={vStyles.cardTitle}>✅ Marque as visitas realizadas</Text>
              <View style={vStyles.visitasList}>
                {visitasLocais.length === 0 ? (
                  <View style={vStyles.empty}>
                    <Text style={vStyles.emptyText}>Nenhuma visita registrada</Text>
                  </View>
                ) : (
                  visitasLocais
                    .sort((a, b) => {
                      if (a.data && b.data) return a.data.localeCompare(b.data);
                      if (a.data) return -1;
                      if (b.data) return 1;
                      return 0;
                    })
                    .map(visita => (
                      <TouchableOpacity
                        key={visita.id}
                        style={vStyles.visitaItem}
                        onPress={() => abrirModalEditarVisita(visita)}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Switch
                              value={visitasLocaisDone.includes(visita.id)}
                              onValueChange={(checked) => toggleVisitaLocalDone(visita.id, checked)}
                            />
                            <Text style={[vStyles.visitaNome, visitasLocaisDone.includes(visita.id) && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                              {visita.nome}
                            </Text>
                          </View>
                          {visita.endereco && (
                            <Text style={vStyles.visitaEndereco}>📍 {visita.endereco}</Text>
                          )}
                          {visita.data && (
                            <Text style={vStyles.visitaData}>📅 {visita.data} {visita.horario ? `às ${visita.horario}` : ''}</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => deletarVisitaLocal(visita.id)}
                          style={vStyles.deleteBtn}
                        >
                          <Text style={vStyles.deleteBtnText}>🗑</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Nova/Editar Visita */}
      <Modal visible={showModalNovaVisita} transparent animationType="slide">
        <View style={vStyles.modalOverlay}>
          <View style={vStyles.modalBox}>
            <View style={vStyles.modalHeader}>
              <Text style={vStyles.modalTitle}>
                {editingId !== null ? '🏠 Editar Visita' : '🏠 Nova Visita Local'}
              </Text>
              <TouchableOpacity onPress={fecharModalNovaVisita}>
                <Text style={vStyles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <View style={{ padding: 16, gap: 12 }}>
                <View>
                  <Text style={vStyles.label}>Nome do(a) visitado(a) *</Text>
                  <TextInput
                    style={vStyles.input}
                    placeholder="Nome completo"
                    value={formNome}
                    onChangeText={setFormNome}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View>
                  <Text style={vStyles.label}>Endereço</Text>
                  <TextInput
                    style={vStyles.input}
                    placeholder="Rua, número, bairro..."
                    value={formEndereco}
                    onChangeText={setFormEndereco}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={vStyles.label}>Data</Text>
                    <TextInput
                      style={vStyles.input}
                      placeholder="YYYY-MM-DD"
                      value={formData}
                      onChangeText={setFormData}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={vStyles.label}>Horário</Text>
                    <TextInput
                      style={vStyles.input}
                      placeholder="HH:MM"
                      value={formHorario}
                      onChangeText={setFormHorario}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View>
                  <Text style={vStyles.label}>Observações</Text>
                  <TextInput
                    style={[vStyles.input, { minHeight: 80 }]}
                    placeholder="Informações adicionais..."
                    value={formObs}
                    onChangeText={setFormObs}
                    placeholderTextColor="#94a3b8"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
              <TouchableOpacity style={vStyles.btnPrimary} onPress={salvarVisitaLocal}>
                <Text style={vStyles.btnPrimaryText}>💾 Salvar Visita</Text>
              </TouchableOpacity>
              <TouchableOpacity style={vStyles.btnSecondary} onPress={fecharModalNovaVisita}>
                <Text style={vStyles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
}

const vStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  menuContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  menuCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  menuIcon: { fontSize: 40 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  submenuHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  backText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  submenuTitle: { fontSize: 16, fontWeight: '800', color: '#4f46e5' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#4f46e5', marginBottom: 12 },
  comunsList: { gap: 10 },
  comunItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  comunName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  visitasList: { gap: 10 },
  visitaItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  visitaNome: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
  visitaEndereco: { fontSize: 12, color: '#64748b', marginTop: 4 },
  visitaData: { fontSize: 12, color: '#64748b', marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#64748b' },
  btnSmPrimary: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  btnSmPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnPrimary: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 13, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  btnSecondaryText: { color: '#4f46e5', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#4f46e5' },
  closeBtn: { fontSize: 22, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 9, padding: 10, fontSize: 14, backgroundColor: '#f1f5f9', color: '#1e293b' },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockedIcon: { fontSize: 60, marginBottom: 16 },
  lockedText: { fontSize: 16, color: '#64748b', marginBottom: 24, textAlign: 'center' },
});
