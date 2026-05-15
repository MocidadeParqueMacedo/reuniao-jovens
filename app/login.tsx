import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
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

export default function LoginScreen() {
  const { setAutenticado } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, RegisteredUser>>({});

  // Recarregar usuários quando a tela é focada (volta do admin)
  useFocusEffect(
    React.useCallback(() => {
      const loadUsers = async () => {
        const users = await loadRegisteredUsers();
        setRegisteredUsers(users);
      };
      loadUsers();
    }, [])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);

      // Check if it's admin
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setAutenticado(true);
        await saveCurrentUser(email);
        alert('Login de admin realizado com sucesso!');
        return;
      }

      // Check if user exists
      const user = registeredUsers[email];
      if (!user) {
        alert('Conta não encontrada.\n\nVocê não tem uma conta registrada com este email. Por favor, crie uma conta primeiro.');
        return;
      }

      // Check if user is pending approval
      if (!user.approved) {
        alert('Conta Pendente.\n\nSua solicitação de acesso está aguardando aprovação do administrador. Você será notificado quando for aprovado.');
        return;
      }

      // Check password
      if (user.password !== password) {
        alert('Senha incorreta.\n\nA senha que você digitou está incorreta. Tente novamente.');
        return;
      }

      setAutenticado(true);
      await saveCurrentUser(email);
      alert('Login realizado com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      alert('Por favor, preencha email e senha');
      return;
    }

    if (password.length < 6) {
      alert('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setIsLoading(true);

      // Check if email already exists
      if (registeredUsers[email]) {
        alert('Este email já está cadastrado');
        return;
      }

      // Register new user (pending approval)
      const newUser: RegisteredUser = {
        email,
        password,
        approved: false,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = {
        ...registeredUsers,
        [email]: newUser,
      };

      setRegisteredUsers(updatedUsers);
      await saveRegisteredUsers(updatedUsers);

      alert('Cadastro realizado! Aguardando aprovação do administrador.');
      setEmail('');
      setPassword('');
      setIsRegister(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao cadastrar');
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

          {/* Admin Test Info */}
          <View className="bg-primary/10 border border-primary rounded-lg p-4 mt-6">
            <Text className="text-primary text-xs font-semibold mb-2">👤 Teste como Admin:</Text>
            <Text className="text-primary text-xs">Email: rdj.parquemacedo@gmail.com</Text>
            <Text className="text-primary text-xs">Senha: pqmacedo</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
