import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast, setAutenticado } = useApp();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      // Simular delay de login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAutenticado(true);
      showToast('Login realizado com sucesso!', 'success');
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login', 'error');
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
                Fazer Login
              </Text>
              <Text style={{ fontSize: 14, color: '#cbd5e1', textAlign: 'center' }}>
                Faça login para continuar
              </Text>
            </View>

            {/* Info */}
            <View style={{ backgroundColor: '#1e3a8a', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#3b82f6', marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: '#93c5fd', lineHeight: 18 }}>
                ℹ️ Clique no botão abaixo para entrar no aplicativo.
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 12,
                backgroundColor: '#4f46e5',
                borderWidth: 1.5,
                borderColor: '#6366f1',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  🔓 Entrar no App
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
