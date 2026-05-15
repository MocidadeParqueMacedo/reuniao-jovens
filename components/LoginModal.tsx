import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '@/lib/app-context';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LoginModal({ visible, onSuccess, onCancel }: Props) {
  const { tentarLogin } = useApp();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mostrar, setMostrar] = useState(false);

  function handleLogin() {
    if (tentarLogin(senha)) {
      setSenha(''); setErro('');
      onSuccess();
    } else {
      setErro('❌ Senha incorreta. Tente novamente.');
      setSenha('');
    }
  }

  function handleCancel() {
    setSenha(''); setErro('');
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.box}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Área Restrita</Text>
          <Text style={styles.sub}>Digite a senha para continuar</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!mostrar}
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
              autoFocus
            />
            <TouchableOpacity onPress={() => setMostrar(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{mostrar ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {!!erro && <Text style={styles.erro}>{erro}</Text>}
          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
            <Text style={styles.btnPrimaryText}>🔓 Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(15,12,41,0.82)',
    alignItems: 'center', justifyContent: 'center',
  },
  box: {
    backgroundColor: '#fff', borderRadius: 22,
    padding: 32, width: '88%', maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25, shadowRadius: 60, elevation: 20,
  },
  icon: { fontSize: 44, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 20, textAlign: 'center' },
  inputWrap: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    backgroundColor: '#f1f5f9', marginBottom: 8,
  },
  input: {
    flex: 1, padding: 12, fontSize: 15, color: '#1e293b',
  },
  eyeBtn: { padding: 10 },
  eyeIcon: { fontSize: 18 },
  erro: { color: '#ef4444', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btnPrimary: {
    width: '100%', backgroundColor: '#4f46e5', borderRadius: 12,
    padding: 13, alignItems: 'center', marginBottom: 10,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { padding: 8 },
  cancelText: { color: '#64748b', fontSize: 14 },
});
