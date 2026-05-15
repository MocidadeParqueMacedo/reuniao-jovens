import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useFocusEffect } from 'expo-router';
import { 
  loadRegisteredUsers, 
  saveRegisteredUsers,
  RegisteredUser 
} from '@/lib/auth-persistence';
import { ADMIN_EMAIL } from '@/lib/auth-store';

interface PendingUser {
  email: string;
  createdAt: string;
}

export default function AdminScreen() {
  const { autenticado } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(!autenticado);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const loadPendingUsers = async () => {
        const users = await loadRegisteredUsers();
        const pending = Object.entries(users)
          .filter(([_, user]) => !user.approved)
          .map(([email, user]) => ({
            email,
            createdAt: user.createdAt,
          }));
        setPendingUsers(pending);
      };
      loadPendingUsers();
    }, [])
  );

  const handleApprove = async (email: string) => {
    try {
      const users = await loadRegisteredUsers();
      if (users[email]) {
        users[email].approved = true;
        await saveRegisteredUsers(users);
        setPendingUsers(pendingUsers.filter((u) => u.email !== email));
        Alert.alert('Sucesso', `Usuário ${email} aprovado!`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aprovar o usuário');
    }
  };

  const handleReject = async (email: string) => {
    try {
      const users = await loadRegisteredUsers();
      if (users[email]) {
        delete users[email];
        await saveRegisteredUsers(users);
        setPendingUsers(pendingUsers.filter((u) => u.email !== email));
        Alert.alert('Sucesso', `Usuário ${email} rejeitado!`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível rejeitar o usuário');
    }
  };

  if (!autenticado) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground text-lg">Esta seção requer autenticação</Text>
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          className="bg-primary rounded-lg px-6 py-3 mt-4"
        >
          <Text className="text-white font-bold">Fazer Login</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const renderUserItem = ({ item }: { item: PendingUser }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3">
      <Text className="text-foreground font-semibold text-lg mb-2">{item.email}</Text>
      <Text className="text-muted text-sm mb-4">
        Solicitado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => handleApprove(item.email)}
          className="flex-1 bg-success rounded-lg py-2 items-center"
        >
          <Text className="text-white font-semibold">Aprovar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleReject(item.email)}
          className="flex-1 bg-error rounded-lg py-2 items-center"
        >
          <Text className="text-white font-semibold">Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="flex-1 p-4">
      <ScrollView>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">Dashboard Admin</Text>
          <Text className="text-muted">
            {pendingUsers.length} usuário(s) aguardando aprovação
          </Text>
        </View>

        {/* Admin Info */}
        <View className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
          <Text className="text-primary text-sm">
            👤 Admin: {ADMIN_EMAIL}
          </Text>
        </View>

        {pendingUsers.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted text-lg">Nenhum usuário pendente</Text>
          </View>
        ) : (
          <FlatList
            data={pendingUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.email}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
