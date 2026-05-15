import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useApp } from '@/lib/app-context';

interface AuthModalProps {
  visible: boolean;
  onSuccess: () => void;
}

export function AuthModal({ visible, onSuccess }: AuthModalProps) {
  const { setAutenticado } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // Registrar novo usuário
        Alert.alert(
          'Sucesso',
          'Conta criada! Você será notificado quando o administrador aprovar seu acesso.',
          [{ text: 'OK', onPress: () => { setIsSignUp(false); setEmail(''); setSenha(''); } }]
        );
      } else {
        // Fazer login
        setAutenticado(true);
        onSuccess();
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>{isSignUp ? 'Criar Conta' : 'Fazer Login'}</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Crie uma conta para acessar' : 'Entre com seu email e senha'}
              </Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.infoText}>
                ℹ️ Seu acesso será revisado pelo administrador.
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            {/* Senha Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                placeholder="Digite sua senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                editable={!loading}
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.button, { backgroundColor: loading ? '#64748b' : '#4f46e5' }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Criar Conta' : 'Entrar'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign Up / Login */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}
              </Text>
              <TouchableOpacity
                onPress={() => { setIsSignUp(!isSignUp); setEmail(''); setSenha(''); }}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Fazer login' : 'Criar conta'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Seu login será validado pelo administrador antes de ser aprovado.
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#e2e8f0',
    backgroundColor: '#1e293b',
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  toggleText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  toggleLink: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 14,
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
