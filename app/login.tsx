import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '@/lib/useGoogleAuth';
import { trpc } from '@/lib/trpc';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast, setAutenticado } = useApp();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError, userInfo } = useGoogleAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const googleLoginMutation = trpc.auth.googleLogin.useMutation();

  // Quando o usuário faz login com Google, enviar para o backend
  useEffect(() => {
    if (userInfo && !isProcessing) {
      handleBackendLogin(userInfo);
    }
  }, [userInfo]);

  const handleBackendLogin = async (user: any) => {
    try {
      setIsProcessing(true);
      
      const result = await googleLoginMutation.mutateAsync({
        email: user.email,
      });

      if (result.success) {
        setAutenticado(true);
        showToast(`Bem-vindo, ${user.name}!`, 'success');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login', 'error');
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login com Google', 'error');
    }
  };

  const isLoading = googleLoading || isProcessing || googleLoginMutation.isPending;

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
              disabled={isLoading}
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                backgroundColor: '#1e293b',
                borderWidth: 1.5,
                borderColor: '#334155',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 16 }}>
                  🔐 Entrar com Google
                </Text>
              )}
            </TouchableOpacity>

            {/* Error Message */}
            {(googleError) && (
              <View style={{ backgroundColor: '#7f1d1d', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: '#fca5a5', fontSize: 12 }}>
                  ⚠️ {googleError}
                </Text>
              </View>
            )}

            {/* Footer */}
            <View style={{ marginTop: 24, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', lineHeight: 18, textAlign: 'center' }}>
                Seu login será validado pelo administrador.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
