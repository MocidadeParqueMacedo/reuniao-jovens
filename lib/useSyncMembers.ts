import { useEffect, useCallback } from 'react';
import { trpc } from './trpc';
import { Member } from './db';

export function useSyncMembers(onSync: (members: Member[]) => void) {
  const { data: backendMembers, isLoading, error } = trpc.members.list.useQuery();
  const createMutation = trpc.members.create.useMutation();
  const updateMutation = trpc.members.update.useMutation();

  // Sync backend data to local state
  useEffect(() => {
    if (backendMembers && !isLoading) {
      const syncedMembers: Member[] = backendMembers.map((m: any) => ({
        id: m.id,
        nome: m.nome,
        genero: m.genero,
        continuacao: m.continuacao,
        nascimento: m.nascimento,
      }));
      onSync(syncedMembers);
    }
  }, [backendMembers, isLoading, onSync]);

  const addMember = useCallback(async (member: Member) => {
    try {
      await createMutation.mutateAsync({
        nome: member.nome,
        genero: member.genero,
        continuacao: member.continuacao,
        dataNascimento: member.nascimento,
      });
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      throw err;
    }
  }, [createMutation]);

  const updateMember = useCallback(async (member: Member) => {
    try {
      await updateMutation.mutateAsync({
        id: member.id,
        nome: member.nome,
        genero: member.genero,
        continuacao: member.continuacao,
        dataNascimento: member.nascimento,
      });
    } catch (err) {
      console.error('Erro ao atualizar membro:', err);
      throw err;
    }
  }, [updateMutation]);

  return {
    isLoading,
    error,
    addMember,
    updateMember,
  };
}
