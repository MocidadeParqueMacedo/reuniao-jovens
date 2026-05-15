import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '@/lib/app-context';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.text}>{toast}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, zIndex: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 10,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
