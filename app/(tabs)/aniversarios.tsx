import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { avatarColor, initials } from '@/lib/db';

function getDaysUntilBirthday(nascimento: string): number {
  const today = new Date();
  const [, m, d] = nascimento.split('-');
  const next = new Date(today.getFullYear(), parseInt(m) - 1, parseInt(d));
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.setHours(0,0,0,0)) / 86400000);
}

function getAge(nascimento: string): number {
  const today = new Date();
  const [y, m, d] = nascimento.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

export default function AniversariosScreen() {
  const { members } = useApp();

  const withBirthday = members
    .filter(m => m.nascimento)
    .map(m => ({ ...m, days: getDaysUntilBirthday(m.nascimento!), age: getAge(m.nascimento!) }))
    .sort((a, b) => a.days - b.days);

  const today = withBirthday.filter(m => m.days === 0);
  const upcoming = withBirthday.filter(m => m.days > 0 && m.days <= 30);
  const rest = withBirthday.filter(m => m.days > 30);

  const [, mo, da] = (withBirthday[0]?.nascimento || '--').split('-');

  function renderItem(m: typeof withBirthday[0]) {
    const color = avatarColor(m.nome);
    const ini = initials(m.nome);
    const [, bm, bd] = m.nascimento!.split('-');
    const isToday = m.days === 0;
    return (
      <View key={m.id} style={[aStyles.item, isToday && aStyles.itemToday]}>
        <View style={[aStyles.avatar, { backgroundColor: color }]}>
          <Text style={aStyles.avatarText}>{ini}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={aStyles.name}>{m.nome}</Text>
          <Text style={aStyles.date}>🎂 {bd}/{bm} · {m.age} anos</Text>
        </View>
        <Text style={[aStyles.days, isToday && { color: '#ec4899' }]}>
          {isToday ? '🎉 Hoje!' : `em ${m.days}d`}
        </Text>
      </View>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top','left','right']}>
      <View style={aStyles.header}>
        <Text style={aStyles.headerTitle}>🎂 Aniversários</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        {withBirthday.length === 0 ? (
          <View style={aStyles.card}>
            <View style={aStyles.empty}>
              <Text style={aStyles.emptyIcon}>🎂</Text>
              <Text style={aStyles.emptyText}>Nenhum aniversário cadastrado</Text>
            </View>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <View style={aStyles.card}>
                <Text style={aStyles.sectionTitle}>🎉 Hoje</Text>
                {today.map(renderItem)}
              </View>
            )}
            {upcoming.length > 0 && (
              <View style={aStyles.card}>
                <Text style={aStyles.sectionTitle}>📅 Próximos 30 dias</Text>
                {upcoming.map(renderItem)}
              </View>
            )}
            {rest.length > 0 && (
              <View style={aStyles.card}>
                <Text style={aStyles.sectionTitle}>📆 Demais Aniversários</Text>
                {rest.map(renderItem)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const aStyles = StyleSheet.create({
  header: { backgroundColor: '#3730a3', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#4f46e5', marginBottom: 10 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  itemToday: { backgroundColor: '#fdf2f8', borderRadius: 10, paddingHorizontal: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  name: { fontWeight: '700', fontSize: 14 },
  date: { fontSize: 12, color: '#64748b', marginTop: 2 },
  days: { fontSize: 12, color: '#f59e0b', fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
});
