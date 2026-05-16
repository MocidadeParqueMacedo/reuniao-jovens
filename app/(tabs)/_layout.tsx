import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWebSocketStatus } from '@/lib/use-websocket-status';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 4);
  const tabBarHeight = 56 + bottomPadding;
  const wsStatus = useWebSocketStatus();

  // Determinar cor e ícone baseado no status
  const getStatusIndicator = () => {
    switch (wsStatus) {
      case 'connected':
        return { color: '#22c55e', icon: '🟢', label: 'Online' };
      case 'disconnected':
        return { color: '#ef4444', icon: '🔴', label: 'Offline' };
      case 'reconnecting':
        return { color: '#f59e0b', icon: '🟡', label: 'Reconectando' };
      default:
        return { color: '#6b7280', icon: '⚪', label: 'Conectando' };
    }
  };

  const indicator = getStatusIndicator();

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🕐" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="aniversarios"
        options={{
          title: 'Aniversários',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="membros"
        options={{
          title: 'Membros',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="visitas"
        options={{
          title: 'Visitas',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="atas"
        options={{
          title: 'Atas',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="versinhos"
        options={{
          title: 'Versinhos',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="atividades"
        options={{
          title: 'Atividades',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
    <View
      style={{
        position: 'absolute',
        top: 8,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: indicator.color,
      }}
    >
      <Text style={{ fontSize: 12 }}>{indicator.icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: indicator.color }}>
        {indicator.label}
      </Text>
    </View>
    </>
  );
}
