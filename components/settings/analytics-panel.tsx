import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/ui/glass-card';
import { Colors, Mono, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { WeeklyInsightsStats } from '@/types/mail';

export function AnalyticsPanel({ stats }: { stats: WeeklyInsightsStats }) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <GlassCard radius={18}>
      <View style={styles.panel}>
        <Text style={[styles.heading, { color: Colors[colorScheme].icon }]}>LAST 7 DAYS — ANALYTICS</Text>
        <View style={styles.grid}>
          <Stat value={stats.totalEmails} label="Total emails" color={Colors[colorScheme].text} colorScheme={colorScheme} />
          <Stat value={stats.needAction} label="Need action" color={Palette.action} colorScheme={colorScheme} />
          <Stat value={stats.unread} label="Unread" color={Palette.warning} colorScheme={colorScheme} />
          <Stat value={stats.critical} label="Important" color={Palette.critical} colorScheme={colorScheme} />
        </View>
      </View>
    </GlassCard>
  );
}

function Stat({
  value,
  label,
  color,
  colorScheme,
}: {
  value: number;
  label: string;
  color: string;
  colorScheme: 'light' | 'dark';
}) {
  return (
    <View
      style={[
        styles.cell,
        {
          backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.45)',
          borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)',
        },
      ]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: Colors[colorScheme].icon }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 18,
    gap: 14,
  },
  heading: {
    fontFamily: Mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  value: {
    fontFamily: Mono,
    fontSize: 25,
    fontWeight: '700',
  },
  label: {
    fontFamily: Mono,
    fontSize: 12,
  },
});
