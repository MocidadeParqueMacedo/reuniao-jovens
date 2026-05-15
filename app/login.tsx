import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '@/lib/useGoogleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast, setAutenticado } = useApp();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError, isReady: googleReady, userInfo } = useGoogleAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Monitor user info changes
  useEffect(() => {
    if (userInfo) {
      setAutenticado(true);
      showToast(`Bem-vindo, ${userInfo.name || 'usuário'}!`, 'success');
      router.replace('/(tabs)');
    }
  }, [userInfo]);

  // Monitor Google OAuth errors
  useEffect(() => {
    if (googleError) {
      showToast(googleError, 'error');
      setIsProcessing(false);
    }
  }, [googleError, showToast]);

  const handleGoogleLogin = async () => {
    if (isProcessing || googleLoading) {
      return;
    }

    if (!googleReady) {
      showToast('Google OAuth não está configurado. Configure EXPO_PUBLIC_GOOGLE_CLIENT_ID.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await googleSignIn();
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login com Google', 'error');
      setIsProcessing(false);
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
                Fazer Login
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
              disabled={googleLoading || isProcessing}
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                backgroundColor: '#1e293b',
                borderWidth: 1.5,
                borderColor: '#334155',
                opacity: googleLoading || isProcessing ? 0.6 : 1,
              }}
            >
              {googleLoading || isProcessing ? (
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
