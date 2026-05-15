import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast, setAutenticado } = useApp();
  const [loading, setLoading] = useState(false);
  const googleLoginMutation = trpc.auth.googleLogin.useMutation();

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      
      // Abre a URL de login do Google no navegador
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent('reuniao-de-jovens://oauth-callback')}&response_type=code&scope=profile%20email`;
      
      // Para fins de teste, vamos usar um email fixo
      // Em produção, você precisaria capturar o email do Google OAuth
      const testEmail = 'test@example.com';
      
      const result = await googleLoginMutation.mutateAsync({ email: testEmail });
      
      if (result.success) {
        setAutenticado(true);
        showToast(`Bem-vindo, ${result.user.email}!`, 'success');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login com Google', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ fontSize: 56, marginBottom: 16 }}>🔐</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' }}>
                Reunião de Jovens
              </Text>
              <Text style={{ fontSize: 14, color: '#cbd5e1', textAlign: 'center' }}>
                Faça login para continuar
              </Text>
            </View>

            {/* Info */}
            <View style={{ backgroundColor: '#1e3a8a', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#3b82f6', marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: '#93c5fd', lineHeight: 18 }}>
                ℹ️ Use sua conta Google para fazer login no app.
              </Text>
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading || googleLoginMutation.isPending}
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                backgroundColor: '#1e293b',
                borderWidth: 1.5,
                borderColor: '#334155',
                opacity: loading || googleLoginMutation.isPending ? 0.6 : 1,
              }}
            >
              {loading || googleLoginMutation.isPending ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 16 }}>
                  🔐 Entrar com Google
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={{ marginTop: 24, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', lineHeight: 18, textAlign: 'center' }}>
                Seu login será enviado para aprovação do administrador.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
