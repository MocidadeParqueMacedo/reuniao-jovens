import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/lib/auth-store';
import { 
  loadRegisteredUsers, 
  saveRegisteredUsers, 
  saveCurrentUser,
  RegisteredUser 
} from '@/lib/auth-persistence';

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  toggleButton: {
    paddingVertical: 4,
  },
  toggleText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});

export default function LoginScreen() {
  const { setAutenticado } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recarregar usuários quando a tela é focada (volta do admin)
  useFocusEffect(
    React.useCallback(() => {
      const loadUsers = async () => {
        console.log('📋 Recarregando usuários ao focar na tela de login');
      };
      loadUsers();
    }, [])
  );

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha email e senha');
      return;
    }

    setIsLoading(true);
    try {
      // Recarregar usuários do AsyncStorage
      const users = await loadRegisteredUsers();
      console.log('🔐 Login - Usuários carregados:', Object.keys(users));

      // 1️⃣ Verificar se email existe
      if (!users[email]) {
        console.log('❌ Email não encontrado:', email);
        Alert.alert(
          'Conta não encontrada',
          'Você não tem uma conta registrada com este email. Por favor, crie uma conta primeiro.'
        );
        return;
      }

      const user = users[email];
      console.log('✅ Email encontrado. Status:', { approved: user.approved });

      // 2️⃣ Verificar se está aprovado
      if (!user.approved) {
        console.log('⏳ Conta pendente de aprovação');
        Alert.alert(
          'Conta Pendente',
          'Sua solicitação de acesso está aguardando aprovação do administrador.'
        );
        return;
      }

      // 3️⃣ Verificar senha
      if (user.password !== password) {
        console.log('❌ Senha incorreta');
        Alert.alert('Erro', 'A senha que você digitou está incorreta. Tente novamente.');
        return;
      }

      // ✅ Login bem-sucedido
      console.log('✅ Login bem-sucedido!');
      await saveCurrentUser(email);
      setAutenticado(true);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      Alert.alert('Erro', error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha email e senha');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const currentUsers = await loadRegisteredUsers();

      // Verificar se email já existe
      if (currentUsers[email]) {
        Alert.alert('Erro', 'Este email já está registrado');
        return;
      }

      // Criar novo usuário
      const newUser: RegisteredUser = {
        email,
        password,
        approved: false,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = {
        ...currentUsers,
        [email]: newUser,
      };

      await saveRegisteredUsers(updatedUsers);

      Alert.alert(
        'Cadastro realizado',
        'Sua conta foi criada! Aguardando aprovação do administrador.'
      );
      setEmail('');
      setPassword('');
      setIsRegister(false);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

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
            onPress={() => {
              console.log('🔘 Botão pressionado! isRegister:', isRegister);
              if (isRegister) {
                handleRegister();
              } else {
                handleLogin();
              }
            }}
            disabled={isLoading}
            style={styles.button}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? 'Cadastrar' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-muted">
              {isRegister ? 'Já tem conta? ' : 'Não tem conta? '}
            </Text>
            <TouchableOpacity 
              onPress={() => setIsRegister(!isRegister)} 
              disabled={isLoading}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {isRegister ? 'Fazer Login' : 'Cadastrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
