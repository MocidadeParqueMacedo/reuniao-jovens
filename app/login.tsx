import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  // tRPC mutations
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const googleLoginMutation = trpc.auth.googleLogin.useMutation();

  const handleGoogleLogin = async () => {
    try {
      showToast('Google OAuth será implementado em breve');
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login com Google');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Por favor, preencha todos os campos');
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({ email, password });
      showToast('Login realizado com sucesso!');
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login');
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      showToast('Por favor, preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      showToast('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      await registerMutation.mutateAsync({ email, password });
      showToast('Cadastro realizado! Aguardando aprovação do administrador.');
      setEmail('');
      setPassword('');
      setName('');
      setIsRegister(false);
    } catch (error: any) {
      showToast(error.message || 'Erro ao cadastrar');
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <ScreenContainer className="bg-gradient-to-b from-primary to-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-white mb-2">
              Reunião de Jovens
            </Text>
            <Text className="text-lg text-white opacity-80">
              {isRegister ? 'Criar Conta' : 'Fazer Login'}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {isRegister && (
              <View>
                <Text className="text-foreground font-semibold mb-2">Nome</Text>
                <TextInput
                  placeholder="Seu nome completo"
                  value={name}
                  onChangeText={setName}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  editable={!isLoading}
                />
              </View>
            )}

            <View>
              <Text className="text-foreground font-semibold mb-2">Email</Text>
              <TextInput
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-foreground font-semibold mb-2">Senha</Text>
              <TextInput
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!isLoading}
              />
              {isRegister && (
                <Text className="text-muted text-xs mt-1">Mínimo 6 caracteres</Text>
              )}
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={isLoading}
            className="bg-primary rounded-lg py-4 mt-6 flex-row items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {isRegister ? 'Cadastrar' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Google OAuth Button */}
          {!isRegister && (
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isLoading}
              className="bg-surface border border-border rounded-lg py-4 mt-4 flex-row items-center justify-center"
            >
              <Text className="text-foreground font-semibold text-lg">🔐 Entrar com Google</Text>
            </TouchableOpacity>
          )}

          {/* Toggle */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-muted">
              {isRegister ? 'Já tem conta? ' : 'Não tem conta? '}
            </Text>
            <TouchableOpacity onPress={() => setIsRegister(!isRegister)} disabled={isLoading}>
              <Text className="text-primary font-bold">
                {isRegister ? 'Fazer Login' : 'Cadastrar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          {isRegister && (
            <View className="bg-warning/10 border border-warning rounded-lg p-4 mt-6">
              <Text className="text-warning text-sm">
                ℹ️ Seu cadastro será enviado para aprovação do administrador. Você receberá uma notificação quando for aprovado.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
