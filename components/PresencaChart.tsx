import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Meeting, Member, formatDate } from '@/lib/db';

interface PresencaChartProps {
  meetings: Meeting[];
  members: Member[];
  chartType: 'line' | 'bar';
  title: string;
}

export function PresencaChart({ meetings, members, chartType, title }: PresencaChartProps) {
  const screenWidth = Dimensions.get('window').width;

  const chartData = useMemo(() => {
    const sortedMeetings = [...meetings].sort((a, b) => a.date.localeCompare(b.date));
    
    const labels = sortedMeetings.map(m => {
      const date = new Date(m.date + 'T00:00:00');
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const data = sortedMeetings.map(m => m.present?.length || 0);

    return {
      labels,
      datasets: [
        {
          data,
          strokeWidth: 2,
          color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
          fill: chartType === 'line',
        },
      ],
    };
  }, [meetings, chartType]);

  const chartConfig: any = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 11,
    },
  };

  if (meetings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>📊 Nenhuma reunião no período</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartWrapper}>
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={250}
            chartConfig={chartConfig}
            bezier
            withVerticalLabels
            withHorizontalLabels
            withInnerLines
            withOuterLines
          />
        ) : (
          <BarChart
            data={chartData}
            width={screenWidth - 32}
            height={250}
            chartConfig={chartConfig}
            withVerticalLabels
            withHorizontalLabels
            yAxisLabel=""
            yAxisSuffix=""
          />
        )}
      </View>
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total de Reuniões</Text>
          <Text style={styles.statValue}>{meetings.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Média de Presença</Text>
          <Text style={styles.statValue}>
            {meetings.length > 0
              ? Math.round((meetings.reduce((sum, m) => sum + (m.present?.length || 0), 0) / meetings.length) * 10) / 10
              : '—'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo de Presentes</Text>
          <Text style={styles.statValue}>
            {meetings.length > 0 ? Math.max(...meetings.map(m => m.present?.length || 0)) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4f46e5',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});
