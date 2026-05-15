import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { loadCurrentUser } from '@/lib/auth-persistence';

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default function PerfilScreen() {
  const { autenticado, logout } = useApp();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Carregar email do usuário logado
  useEffect(() => {
    const loadUserEmail = async () => {
      const email = await loadCurrentUser();
      console.log('📧 Email do usuário logado:', email);
      setCurrentUserEmail(email);
    };
    loadUserEmail();
  }, [autenticado]);

  const handleLogout = () => {
    Alert.alert(
      'Fazer Logout',
      'Tem certeza que deseja sair da aplicação?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            logout();
            Alert.alert('Sucesso', 'Você foi desconectado!');
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!autenticado) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground text-lg mb-4">Você não está logado</Text>
        <TouchableOpacity className="bg-primary rounded-lg px-6 py-3">
          <Text className="text-white font-bold">Fazer Login</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 p-4">
      <ScrollView>
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Meu Perfil</Text>
          <Text className="text-muted">Gerencie suas configurações</Text>
        </View>

        {/* Profile Info */}
        <View className="bg-surface border border-border rounded-lg p-6 mb-6">
          <View className="mb-4">
            <Text className="text-muted text-sm mb-1">Email</Text>
            <Text className="text-foreground font-semibold text-lg">
              {currentUserEmail || 'Carregando...'}
            </Text>
          </View>
          <View>
            <Text className="text-muted text-sm mb-1">Status</Text>
            <Text className="text-success font-semibold">✓ Autenticado</Text>
          </View>
        </View>

        {/* Settings */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Configurações</Text>
          
          <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center justify-between">
            <Text className="text-foreground font-semibold">Notificações</Text>
            <Text className="text-muted">Ativadas</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center justify-between">
            <Text className="text-foreground font-semibold">Tema</Text>
            <Text className="text-muted">Automático</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
            <Text className="text-foreground font-semibold">Idioma</Text>
            <Text className="text-muted">Português</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button - USANDO STYLE */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>🚪 Fazer Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-8 pt-6 border-t border-border items-center">
          <Text className="text-muted text-xs">Reunião de Jovens v1.0.0</Text>
          <Text className="text-muted text-xs mt-1">© 2026 Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
