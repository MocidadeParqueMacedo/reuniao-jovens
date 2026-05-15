import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
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
  const { setAutenticado, showToast } = useApp();
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

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Por favor, preencha email e senha', 'error');
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
        showToast('Você não tem uma conta registrada. Crie uma conta primeiro.', 'error');
        setIsLoading(false);
        return;
      }

      const user = users[email];
      console.log('✅ Email encontrado. Status:', { approved: user.approved });

      // 2️⃣ Verificar se está aprovado
      if (!user.approved) {
        console.log('⏳ Conta pendente de aprovação');
        showToast('Sua conta está aguardando aprovação do administrador.', 'error');
        setIsLoading(false);
        return;
      }

      // 3️⃣ Verificar senha
      if (user.password !== password) {
        console.log('❌ Senha incorreta');
        showToast('Senha incorreta. Tente novamente.', 'error');
        setIsLoading(false);
        return;
      }

      // ✅ Login bem-sucedido
      console.log('✅ Login bem-sucedido!');
      await saveCurrentUser(email);
      setIsLoading(false);
      showToast('Login realizado com sucesso!', 'success');
      setAutenticado(true);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      setIsLoading(false);
      showToast(error.message || 'Erro ao fazer login', 'error');
    }
  };

  // ─── REGISTER ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Por favor, preencha email e senha', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const users = await loadRegisteredUsers();

      if (users[email]) {
        showToast('Este email já está registrado', 'error');
        setIsLoading(false);
        return;
      }

      // Criar novo usuário
      const newUser: RegisteredUser = {
        email,
        password,
        approved: false,
        createdAt: new Date().toISOString(),
      };

      users[email] = newUser;
      await saveRegisteredUsers(users);

      showToast('Conta criada! Aguarde aprovação do administrador.', 'success');
      setEmail('');
      setPassword('');
      setIsRegister(false);
    } catch (error: any) {
      console.error('❌ Erro ao registrar:', error);
      showToast(error.message || 'Erro ao criar conta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ marginBottom: 48 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 8 }}>
            {isRegister ? 'Criar Conta' : 'Login'}
          </Text>
          <Text style={{ fontSize: 16, color: '#666' }}>
            {isRegister ? 'Preencha seus dados para criar uma conta' : 'Faça login para continuar'}
          </Text>
        </View>

        {/* Email Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 }}>Email</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#000',
            }}
            placeholder="seu@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 }}>Senha</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              color: '#000',
            }}
            placeholder="Sua senha"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        {/* Login/Register Button */}
        <TouchableOpacity
          onPress={isRegister ? handleRegister : handleLogin}
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegister ? 'Criar Conta' : 'Entrar'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle Register/Login */}
        <TouchableOpacity
          onPress={() => {
            setIsRegister(!isRegister);
            setEmail('');
            setPassword('');
          }}
          style={styles.toggleButton}
          disabled={isLoading}
        >
          <Text style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
            {isRegister ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
            <Text style={styles.toggleText}>
              {isRegister ? 'Faça login' : 'Crie uma'}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
