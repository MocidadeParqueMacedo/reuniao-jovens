import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export default function AdminScreen() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch pending users
  const { data: pendingUsers, isLoading, refetch } = trpc.users.pending.useQuery();

  // Mutations
  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedUserId(null);
    },
  });

  const rejectMutation = trpc.users.reject.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedUserId(null);
    },
  });

  const handleApprove = (userId: number) => {
    approveMutation.mutate({ userId });
  };

  const handleReject = (userId: number) => {
    rejectMutation.mutate({ userId });
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-foreground">Painel de Admin</Text>
        <Pressable
          onPress={() => router.back()}
          className="p-2"
        >
          <Text className="text-primary">← Voltar</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : !pendingUsers || pendingUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-center">Nenhum usuário pendente de aprovação</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Usuários Pendentes ({pendingUsers.length})
            </Text>

            {pendingUsers.map((user) => (
              <View
                key={user.id}
                className="bg-surface rounded-lg p-4 border border-border"
              >
                <Text className="text-base font-semibold text-foreground">{user.email}</Text>
                <Text className="text-sm text-muted mt-1">
                  Status: <Text className="font-semibold">Pendente</Text>
                </Text>
                <Text className="text-sm text-muted mt-1">
                  Cadastrado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </Text>

                <View className="flex-row gap-3 mt-4">
                  <Pressable
                    onPress={() => handleApprove(user.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-success rounded-lg p-3 items-center"
                  >
                    {approveMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">Aprovar</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleReject(user.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 bg-error rounded-lg p-3 items-center"
                  >
                    {rejectMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-semibold">Rejeitar</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
