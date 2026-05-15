import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '@/lib/app-context';
import { useGoogleAuth } from '@/lib/useGoogleAuth';

interface AuthModalProps {
  visible: boolean;
  onSuccess: () => void;
}

export function AuthModal({ visible, onSuccess }: AuthModalProps) {
  const { showToast, setAutenticado } = useApp();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError, isReady: googleReady } = useGoogleAuth();

  // Monitor Google OAuth errors
  useEffect(() => {
    if (googleError) {
      showToast(googleError, 'error');
    }
  }, [googleError, showToast]);

  const handleGoogleLogin = async () => {
    if (!googleReady) {
      showToast('Google OAuth não está configurado. Configure EXPO_PUBLIC_GOOGLE_CLIENT_ID.', 'error');
      return;
    }
    try {
      await googleSignIn();
      showToast('Login com Google realizado com sucesso!', 'success');
      setAutenticado(true);
      onSuccess();
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login com Google', 'error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.icon}>🔐</Text>
              <Text style={styles.title}>Fazer Login</Text>
              <Text style={styles.subtitle}>
                Faça login para continuar
              </Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.infoText}>
                ℹ️ Use sua conta Google para fazer login no app.
              </Text>
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              style={[styles.button, styles.googleButton]}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text style={styles.googleButtonText}>🔐 Entrar com Google</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Seu login será enviado para aprovação do administrador.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 41, 0.9)',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  info: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#93c5fd',
    lineHeight: 18,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  googleButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    textAlign: 'center',
  },
});
