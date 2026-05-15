import { useEffect, useCallback } from 'react';
import { trpc } from './trpc';
import { Meeting, Visitor } from './db';

export function useSyncMeetings(onSync: (meetings: Meeting[]) => void) {
  const { data: backendMeetings, isLoading, error } = trpc.meetings.list.useQuery();
  const createMeetingMutation = trpc.meetings.create.useMutation();
  const createPresencaMutation = trpc.presenca.create.useMutation();

  // Sync backend data to local state
  useEffect(() => {
    if (backendMeetings && !isLoading) {
      const syncedMeetings: Meeting[] = backendMeetings.map((m: any) => ({
        id: m.id.toString(),
        date: m.date || m.data,
        present: m.present || [],
        isScheduled: m.isScheduled,
        title: m.title,
      }));

      onSync(syncedMeetings);
    }
  }, [backendMeetings, isLoading, onSync]);

  const addMeeting = useCallback(async (date: string) => {
    try {
      await createMeetingMutation.mutateAsync({ date });
    } catch (err) {
      console.error('Erro ao adicionar reunião:', err);
      throw err;
    }
  }, [createMeetingMutation]);

  const addPresenca = useCallback(async (meetingId: number, memberId: number) => {
    try {
      await createPresencaMutation.mutateAsync({
        meetingId,
        memberId,
        presente: 1,
      });
    } catch (err) {
      console.error('Erro ao adicionar presença:', err);
      throw err;
    }
  }, [createPresencaMutation]);

  return {
    isLoading,
    error,
    addMeeting,
    addPresenca,
  };
}
