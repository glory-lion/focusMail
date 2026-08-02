import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getActionItemsDone, setActionItemDone } from '@/services/actionItemState';
import type { ActionItem } from '@/types/mail';

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  const isMidnight = /T00:00:00(\.000)?Z$/.test(iso);
  const dayLabel =
    date.toDateString() === new Date().toDateString()
      ? 'Today'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  if (isMidnight) return dayLabel; // date only, no time was stated in the email
  return `${dayLabel} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function ActionItems({ items }: { items: ActionItem[] }) {
  const colorScheme = useColorScheme() ?? 'light';
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getActionItemsDone(items.map((item) => item.id)).then(setDone);
  }, [items]);

  if (items.length === 0) return null;

  const toggle = (id: string) => {
    const next = !done[id];
    setDone((prev) => ({ ...prev, [id]: next }));
    setActionItemDone(id, next);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={[styles.heading, { color: Colors[colorScheme].icon }]}>
        ACTION ITEMS
      </ThemedText>
      {items.map((item) => {
        const isDone = done[item.id] ?? false;
        return (
          <Pressable key={item.id} style={styles.row} onPress={() => toggle(item.id)}>
            <View
              style={[
                styles.checkbox,
                { borderColor: Colors[colorScheme].border },
                isDone ? { backgroundColor: Colors[colorScheme].tint, borderColor: Colors[colorScheme].tint } : null,
              ]}
            />
            <ThemedText
              style={[
                styles.text,
                isDone ? [styles.textDone, { color: Colors[colorScheme].icon }] : null,
              ]}>
              {item.text}
            </ThemedText>
            {item.dueDate ? (
              <ThemedText style={[styles.due, { color: Colors[colorScheme].tint }]}>
                {formatDueDate(item.dueDate)}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  heading: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
  textDone: {
    textDecorationLine: 'line-through',
  },
  due: {
    fontSize: 12,
  },
});
