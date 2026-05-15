import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';

export default function LoginScreen() {
  const { setAutenticado } = useApp();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // Registrar novo usuário
        Alert.alert(
          "Sucesso",
          "Conta criada! Você será notificado quando o administrador aprovar seu acesso.",
          [{ text: "OK", onPress: () => setIsSignUp(false) }]
        );
        setEmail("");
        setSenha("");
      } else {
        // Fazer login
        setAutenticado(true);
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao fazer login");
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
                {isSignUp ? "Criar Conta" : "Fazer Login"}
              </Text>
              <Text style={{ fontSize: 14, color: '#cbd5e1', textAlign: 'center' }}>
                {isSignUp ? "Crie uma conta para acessar" : "Entre com seu email e senha"}
              </Text>
            </View>

            {/* Info */}
            <View style={{ backgroundColor: '#1e3a8a', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#3b82f6', marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: '#93c5fd', lineHeight: 18 }}>
                ℹ️ Seu acesso será revisado pelo administrador.
              </Text>
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 }}>Email</Text>
              <TextInput
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                placeholderTextColor="#64748b"
                style={{
                  borderWidth: 1,
                  borderColor: '#334155',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  color: '#e2e8f0',
                  backgroundColor: '#1e293b',
                  fontSize: 14,
                }}
              />
            </View>

            {/* Senha Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 }}>Senha</Text>
              <TextInput
                placeholder="Digite sua senha"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                editable={!loading}
                placeholderTextColor="#64748b"
                style={{
                  borderWidth: 1,
                  borderColor: '#334155',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  color: '#e2e8f0',
                  backgroundColor: '#1e293b',
                  fontSize: 14,
                }}
              />
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
                backgroundColor: loading ? '#64748b' : '#4f46e5',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  {isSignUp ? "Criar Conta" : "Entrar"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Sign Up / Login */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>
                {isSignUp ? "Já tem conta?" : "Não tem conta?"}
              </Text>
              <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setEmail(""); setSenha(""); }} disabled={loading}>
                <Text style={{ color: '#4f46e5', fontWeight: '600', fontSize: 14 }}>
                  {isSignUp ? "Fazer login" : "Criar conta"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ marginTop: 24, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', lineHeight: 18, textAlign: 'center' }}>
                Seu login será validado pelo administrador antes de ser aprovado.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
