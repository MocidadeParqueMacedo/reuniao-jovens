import { View, Text, Animated } from 'react-native';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import { useEffect, useRef } from 'react';

export function OfflineNotice() {
  const { isOnline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!isOnline) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  if (isOnline) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{ transform: [{ translateY: slideAnim }] }}
      className="bg-warning px-4 py-3 flex-row items-center gap-2"
    >
      <Text className="text-white font-semibold flex-1">
        ⚠️ Você está offline. Os dados serão sincronizados quando voltar online.
      </Text>
    </Animated.View>
  );
}
