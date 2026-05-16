import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { ActivityNotification } from '@/lib/activity-notifications';

interface ActivityToastProps {
  notification: ActivityNotification | null;
}

export function ActivityToast({ notification }: ActivityToastProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (notification) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Fade out após 3.5 segundos
      const timeout = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 3500);

      return () => clearTimeout(timeout);
    }
  }, [notification, fadeAnim]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'member_added':
        return '👤';
      case 'member_updated':
        return '✏️';
      case 'member_deleted':
        return '🗑️';
      case 'event_created':
        return '📅';
      case 'presence_marked':
        return '✅';
      case 'ata_created':
        return '📋';
      case 'versinho_added':
        return '📖';
      default:
        return '📢';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(notification.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    right: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    fontSize: 20,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f3f4f6',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
