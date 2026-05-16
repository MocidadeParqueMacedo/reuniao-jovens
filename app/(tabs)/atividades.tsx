import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList,
  Pressable, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { ActivityHistory, ActivityRecord } from '@/lib/activity-history';

const ACTIVITY_ICONS: Record<ActivityRecord['type'], string> = {
  member_added: '👤',
  member_updated: '✏️',
  member_deleted: '🗑️',
  event_created: '📅',
  presence_marked: '✅',
  ata_created: '📋',
  versinho_added: '📖',
};

const ACTIVITY_LABELS: Record<ActivityRecord['type'], string> = {
  member_added: 'Membro Adicionado',
  member_updated: 'Membro Atualizado',
  member_deleted: 'Membro Removido',
  event_created: 'Evento Criado',
  presence_marked: 'Presença Marcada',
  ata_created: 'Ata Criada',
  versinho_added: 'Versinho Adicionado',
};

interface FilterOptions {
  type: ActivityRecord['type'] | 'all';
  period: 'all' | '1h' | '24h' | '7d';
}

export default function AtividadesScreen() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ActivityRecord[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ type: 'all', period: '24h' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Carregar histórico ao focar
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    await ActivityHistory.load();
    const allRecords = ActivityHistory.getAll();
    setRecords(allRecords);
    applyFilters(allRecords, filters);
  }

  function applyFilters(data: ActivityRecord[], filterOptions: FilterOptions) {
    let filtered = [...data];

    // Filtrar por tipo
    if (filterOptions.type !== 'all') {
      filtered = filtered.filter((r) => r.type === filterOptions.type);
    }

    // Filtrar por período
    const now = Date.now();
    if (filterOptions.period !== 'all') {
      const hours =
        filterOptions.period === '1h' ? 1 : filterOptions.period === '24h' ? 24 : 7 * 24;
      const cutoff = now - hours * 60 * 60 * 1000;
      filtered = filtered.filter((r) => r.timestamp > cutoff);
    }

    setFilteredRecords(filtered);
    setPage(1);
  }

  function handleFilterChange(newFilters: FilterOptions) {
    setFilters(newFilters);
    applyFilters(records, newFilters);
  }

  async function handleClearHistory() {
    Alert.alert('Limpar Histórico', 'Deseja limpar todo o histórico de atividades?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          await ActivityHistory.clear();
          setRecords([]);
          setFilteredRecords([]);
        },
      },
    ]);
  }

  const stats = ActivityHistory.getStats();
  const paginatedData = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  return (
    <ScreenContainer className="flex-1 bg-gray-50">
      {/* Header com Estatísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Atividades Recentes</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{Object.keys(stats.byUser).length}</Text>
            <Text style={styles.statLabel}>Usuários</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{Object.keys(stats.byType).length}</Text>
            <Text style={styles.statLabel}>Tipos</Text>
          </View>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>🔍 Filtros</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
          <Text style={styles.clearButtonText}>🗑️ Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Painel de Filtros */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Tipo de Atividade</Text>
          <View style={styles.filterOptions}>
            {(['all', 'member_added', 'event_created', 'presence_marked'] as const).map(
              (type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.filterOption,
                    filters.type === type && styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    handleFilterChange({ ...filters, type: type as FilterOptions['type'] })
                  }
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.type === type && styles.filterOptionTextActive,
                    ]}
                  >
                    {type === 'all' ? 'Todos' : ACTIVITY_LABELS[type]}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <Text style={styles.filterTitle}>Período</Text>
          <View style={styles.filterOptions}>
            {(['all', '1h', '24h', '7d'] as const).map((period) => (
              <Pressable
                key={period}
                style={[
                  styles.filterOption,
                  filters.period === period && styles.filterOptionActive,
                ]}
                onPress={() => handleFilterChange({ ...filters, period })}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.period === period && styles.filterOptionTextActive,
                  ]}
                >
                  {period === 'all'
                    ? 'Tudo'
                    : period === '1h'
                    ? '1 hora'
                    : period === '24h'
                    ? '24 horas'
                    : '7 dias'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Lista de Atividades */}
      <FlatList
        data={paginatedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.activityItem}
            onPress={() => setSelectedRecord(item)}
          >
            <Text style={styles.activityIcon}>{ACTIVITY_ICONS[item.type]}</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <View style={styles.activityMeta}>
                <Text style={styles.activityUser}>{item.userName}</Text>
                <Text style={styles.activityTime}>
                  {new Date(item.timestamp).toLocaleString('pt-BR')}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📭 Nenhuma atividade encontrada</Text>
          </View>
        }
        scrollEnabled={false}
      />

      {/* Paginação */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={page === 1}
            onPress={() => setPage(page - 1)}
            style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
          >
            <Text style={styles.paginationButtonText}>← Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Página {page} de {totalPages}
          </Text>
          <TouchableOpacity
            disabled={page === totalPages}
            onPress={() => setPage(page + 1)}
            style={[
              styles.paginationButton,
              page === totalPages && styles.paginationButtonDisabled,
            ]}
          >
            <Text style={styles.paginationButtonText}>Próxima →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Detalhes */}
      <Modal visible={!!selectedRecord} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedRecord(null)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {selectedRecord && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>{ACTIVITY_ICONS[selectedRecord.type]}</Text>
                  <Text style={styles.modalTitle}>
                    {ACTIVITY_LABELS[selectedRecord.type]}
                  </Text>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Mensagem</Text>
                    <Text style={styles.modalValue}>{selectedRecord.message}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Usuário</Text>
                    <Text style={styles.modalValue}>{selectedRecord.userName}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Data e Hora</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedRecord.timestamp).toLocaleString('pt-BR')}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Tipo de Dado</Text>
                    <Text style={styles.modalValue}>{selectedRecord.dataType}</Text>
                  </View>

                  {selectedRecord.details && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Detalhes</Text>
                      <Text style={styles.modalValue}>
                        {JSON.stringify(selectedRecord.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterPanel: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    alignItems: 'flex-start',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityUser: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalBody: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
});
