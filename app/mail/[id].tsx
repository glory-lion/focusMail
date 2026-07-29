import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ImportantTag } from '@/components/mail/important-tag';
import { SummaryBadge } from '@/components/mail/summary-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEmailById, markAsRead, sendReply } from '@/services/mailService';
import type { Email } from '@/types/mail';

function formatFullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EmailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const [email, setEmail] = useState<Email | undefined | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    getEmailById(id).then((result) => {
      setEmail(result ?? undefined);
      setReplyText(result?.suggestedReply ?? '');
      if (result && !result.read) {
        markAsRead(result.id);
      }
    });
  }, [id]);

  if (email === null) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!email) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>This email could not be found.</ThemedText>
      </ThemedView>
    );
  }

  const { detailedSummary } = email;
  const hasStructuredDetails =
    detailedSummary.meetingLink ||
    detailedSummary.date ||
    detailedSummary.time ||
    detailedSummary.venue ||
    (detailedSummary.deadlines && detailedSummary.deadlines.length > 0);

  const handleSend = async () => {
    setSendState('sending');
    await sendReply(email.id, replyText);
    setSendState('sent');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: email.subject, headerBackTitle: 'Inbox' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <View style={styles.senderRow}>
            <ThemedText type="defaultSemiBold" style={styles.senderName}>
              {email.sender.name}
            </ThemedText>
            <ThemedText style={[styles.time, { color: Colors[colorScheme].icon }]}>
              {formatFullTimestamp(email.timestamp)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.senderEmail, { color: Colors[colorScheme].icon }]}>
            {email.sender.email}
          </ThemedText>
          <ThemedText type="title" style={styles.subject}>
            {email.subject}
          </ThemedText>
          <ImportantTag important={email.important} />
        </View>

        <SummaryBadge text={detailedSummary.keyPoints.join(' ')} expanded />

        {hasStructuredDetails ? (
          <View style={[styles.detailsBlock, { borderColor: Colors[colorScheme].border }]}>
            {detailedSummary.date ? (
              <DetailRow icon="calendar" text={detailedSummary.date} />
            ) : null}
            {detailedSummary.time ? (
              <DetailRow icon="clock.fill" text={detailedSummary.time} />
            ) : null}
            {detailedSummary.venue ? (
              <DetailRow icon="mappin.and.ellipse" text={detailedSummary.venue} />
            ) : null}
            {detailedSummary.meetingLink ? (
              <DetailRow icon="link" text={detailedSummary.meetingLink} />
            ) : null}
            {detailedSummary.deadlines?.map((deadline, index) => (
              <DetailRow key={index} icon="checkmark.circle.fill" text={deadline} />
            ))}
          </View>
        ) : null}

        <ThemedText style={styles.body}>{email.body}</ThemedText>

        <View style={styles.replySection}>
          <ThemedText type="defaultSemiBold" style={styles.replyLabel}>
            Suggested reply
          </ThemedText>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            multiline
            placeholder="Write a reply…"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[
              styles.replyInput,
              {
                color: Colors[colorScheme].text,
                borderColor: Colors[colorScheme].border,
              },
            ]}
          />
          <View style={styles.replyActions}>
            <Pressable
              onPress={handleSend}
              disabled={!replyText.trim() || sendState !== 'idle'}
              style={[
                styles.sendButton,
                { backgroundColor: Colors[colorScheme].tint },
                (!replyText.trim() || sendState !== 'idle') && styles.disabled,
              ]}>
              <ThemedText type="defaultSemiBold" lightColor="#fff" darkColor="#fff">
                {sendState === 'sent' ? 'Sent' : sendState === 'sending' ? 'Sending…' : 'Send reply'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function DetailRow({ icon, text }: { icon: Parameters<typeof IconSymbol>[0]['name']; text: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  return (
    <View style={styles.detailRow}>
      <IconSymbol name={icon} size={18} color={Colors[colorScheme].tint} />
      <ThemedText style={styles.detailText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  headerBlock: {
    gap: 6,
  },
  senderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 16,
  },
  senderEmail: {
    fontSize: 13,
  },
  time: {
    fontSize: 13,
  },
  subject: {
    fontSize: 22,
    marginTop: 6,
    marginBottom: 4,
  },
  detailsBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    flexShrink: 1,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  replySection: {
    gap: 10,
    marginTop: 8,
  },
  replyLabel: {
    fontSize: 15,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sendButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
