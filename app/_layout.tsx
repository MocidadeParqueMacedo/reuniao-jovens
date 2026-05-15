import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme-provider';
import { AppProvider, useApp } from '@/lib/app-context';
import { Toast } from '@/components/Toast';
import { OfflineNotice } from '@/components/OfflineNotice';
import '../global.css';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 },
  },
});

function RootLayoutContent() {
  const { autenticado } = useApp();

  console.log('🔄 RootLayoutContent - autenticado:', autenticado);

  // Renderização condicional: mostrar login OU tabs baseado em autenticado
  if (autenticado) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    );
  } else {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppProvider>
              <RootLayoutContent />
              <OfflineNotice />
              <Toast />
              <StatusBar style="light" />
            </AppProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
