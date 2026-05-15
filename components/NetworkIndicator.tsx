import { View, Text } from 'react-native';
import { useNetworkStatus } from '@/lib/useNetworkStatus';

export function NetworkIndicator() {
  const { isOnline, isLoading } = useNetworkStatus();

  if (isLoading) return null;

  const bgColor = isOnline ? 'bg-success' : 'bg-error';
  const statusText = isOnline ? 'Online' : 'Offline';
  const icon = isOnline ? '🟢' : '🔴';

  return (
    <View className={`${bgColor} px-3 py-1 rounded-full flex-row items-center gap-2`}>
      <Text className="text-white text-xs font-semibold">
        {icon} {statusText}
      </Text>
    </View>
  );
}
