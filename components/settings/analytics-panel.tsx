import { StyleSheet, Text, View } from 'react-native';

import { Mono, Palette } from '@/constants/theme';
import type { WeeklyInsightsStats } from '@/types/mail';

export function AnalyticsPanel({ stats }: { stats: WeeklyInsightsStats }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>LAST 7 DAYS — ANALYTICS</Text>
      <View style={styles.grid}>
        <Stat value={stats.totalEmails} label="Total emails" color="#fff" />
        <Stat value={stats.needAction} label="Need action" color={Palette.action} />
        <Stat value={stats.unread} label="Unread" color={Palette.warning} />
        <Stat value={stats.critical} label="Critical" color={Palette.critical} />
      </View>
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.cell}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Palette.panelBackground,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  heading: {
    fontFamily: Mono,
    fontSize: 12,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.45)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  value: {
    fontFamily: Mono,
    fontSize: 26,
    fontWeight: '700',
  },
  label: {
    fontFamily: Mono,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
});
