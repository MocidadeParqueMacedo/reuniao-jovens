import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/lib/app-context';
import { loadCurrentUser, saveCurrentUser } from '@/lib/auth-persistence';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 100,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  logoutButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default function PerfilScreen() {
  const router = useRouter();
  const { autenticado, logout } = useApp();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadUserEmail = async () => {
      const email = await loadCurrentUser();
      setCurrentUserEmail(email);
    };
    loadUserEmail();
  }, [autenticado]);

  const handleLogout = async () => {
    console.log('🚪 Botão logout clicado');
    Alert.alert(
      'Fazer Logout',
      'Tem certeza que deseja sair da aplicação?',
      [
        { text: 'Cancelar', onPress: () => console.log('Logout cancelado'), style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('🚪 Iniciando logout...');
              await saveCurrentUser(null);
              console.log('✅ Dados limpos');
              await logout();
              console.log('✅ Logout executado');
              router.replace('/login');
              console.log('✅ Navegado para login');
            } catch (error) {
              console.error('❌ Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Erro ao fazer logout. Tente novamente.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!autenticado) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.title}>Você não está logado</Text>
          <TouchableOpacity 
            onPress={() => router.replace('/login')}
            style={{ backgroundColor: '#0a7ea4', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Fazer Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Meu Perfil</Text>
          <Text style={styles.subtitle}>Gerencie suas configurações</Text>
        </View>

        <View style={styles.card}>
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{currentUserEmail || 'Carregando...'}</Text>
          </View>
          <View>
            <Text style={styles.label}>Status</Text>
            <Text style={{ ...styles.value, color: '#22c55e' }}>✓ Autenticado</Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notificações</Text>
            <Text style={styles.settingValue}>Ativadas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Tema</Text>
            <Text style={styles.settingValue}>Automático</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Idioma</Text>
            <Text style={styles.settingValue}>Português</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Reunião de Jovens v1.0.0</Text>
          <Text style={{ ...styles.footerText, marginTop: 4 }}>© 2026 Todos os direitos reservados</Text>
        </View>
      </ScrollView>

      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>🚪 Fazer Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
