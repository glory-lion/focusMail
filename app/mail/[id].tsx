import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentCard } from '@/components/mail/attachment-card';
import { ImportantTag } from '@/components/mail/important-tag';
import { SummaryBadge } from '@/components/mail/summary-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TopBarTitle } from '@/components/ui/top-bar-title';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEmailById, markAsRead, sendReply, setArchived, setDeleted } from '@/services/mailService';
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [email, setEmail] = useState<Email | undefined | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const shiftAnim = useRef(new Animated.Value(0)).current;

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

  const handleToggleArchive = async () => {
    const next = !email.archived;
    await setArchived(email.id, next);
    setEmail((prev) => (prev ? { ...prev, archived: next, deleted: next ? false : prev.deleted } : prev));
  };

  const handleToggleDelete = async () => {
    const next = !email.deleted;
    await setDeleted(email.id, next);
    setEmail((prev) => (prev ? { ...prev, deleted: next, archived: next ? false : prev.archived } : prev));
  };

  const handleAttach = () => {
    setReplyAttachments((prev) => [...prev, `Attachment_${prev.length + 1}.pdf`]);
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReplyFocus = () => {
    Animated.timing(shiftAnim, { toValue: -windowHeight * 0.5, duration: 220, useNativeDriver: true }).start();
  };

  const handleReplyBlur = () => {
    Animated.timing(shiftAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backRow}>
          <IconSymbol name="arrow.left" size={20} color={Colors[colorScheme].tint} />
          <TopBarTitle />
        </Pressable>
        <View style={styles.actionsRow}>
          <Pressable onPress={handleToggleArchive} hitSlop={8} style={styles.actionButton}>
            <IconSymbol
              name={email.archived ? 'tray.and.arrow.up.fill' : 'archivebox'}
              size={20}
              color={Colors[colorScheme].icon}
            />
          </Pressable>
          <Pressable onPress={handleToggleDelete} hitSlop={8} style={styles.actionButton}>
            <IconSymbol
              name={email.deleted ? 'trash.slash' : 'trash'}
              size={20}
              color={Colors[colorScheme].icon}
            />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={{ transform: [{ translateY: shiftAnim }] }}>
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
          <View style={styles.subjectRow}>
            <ThemedText type="title" style={styles.subject}>
              {email.subject}
            </ThemedText>
            <ImportantTag important={email.important} />
          </View>
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

        {email.attachments.length > 0 ? (
          <View style={styles.attachments}>
            {email.attachments.map((attachment) => (
              <AttachmentCard key={attachment.fileName} attachment={attachment} />
            ))}
          </View>
        ) : null}

        <View style={[styles.replySection, { borderColor: Colors[colorScheme].tint, backgroundColor: Colors[colorScheme].card }]}>
          <ThemedText type="defaultSemiBold" style={styles.replyLabel}>
            Suggested reply
          </ThemedText>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            onFocus={handleReplyFocus}
            onBlur={handleReplyBlur}
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

          <Pressable onPress={handleAttach} style={styles.attachButton} hitSlop={6}>
            <IconSymbol name="paperclip" size={15} color={Colors[colorScheme].tint} />
            <ThemedText type="defaultSemiBold" style={[styles.attachLabel, { color: Colors[colorScheme].tint }]}>
              Attach files
            </ThemedText>
          </Pressable>

          {replyAttachments.length > 0 ? (
            <View style={styles.replyAttachmentsRow}>
              {replyAttachments.map((name, index) => (
                <View
                  key={`${name}-${index}`}
                  style={[
                    styles.replyAttachmentChip,
                    { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                  ]}>
                  <IconSymbol name="doc.text.fill" size={13} color={Colors[colorScheme].tint} />
                  <ThemedText style={styles.replyAttachmentText} numberOfLines={1}>
                    {name}
                  </ThemedText>
                  <Pressable onPress={() => removeAttachment(index)} hitSlop={8}>
                    <IconSymbol name="xmark" size={12} color={Colors[colorScheme].icon} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={handleSend}
            disabled={!replyText.trim() || sendState !== 'idle'}
            style={[
              styles.sendButton,
              { backgroundColor: Colors[colorScheme].tint },
              (!replyText.trim() || sendState !== 'idle') && styles.disabled,
            ]}>
            <IconSymbol name="paperplane.fill" size={16} color="#fff" />
            <ThemedText type="defaultSemiBold" lightColor="#fff" darkColor="#fff">
              {sendState === 'sent' ? 'Sent' : sendState === 'sending' ? 'Sending…' : 'Send Now'}
            </ThemedText>
          </Pressable>
        </View>
      </Animated.ScrollView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionButton: {
    padding: 2,
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
    fontSize: 15,
  },
  senderEmail: {
    fontSize: 12,
  },
  time: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  subject: {
    flex: 1,
    fontSize: 21,
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
    fontSize: 13,
    flexShrink: 1,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
  attachments: {
    gap: 10,
  },
  replySection: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    gap: 12,
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
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  attachLabel: {
    fontSize: 13,
  },
  replyAttachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  replyAttachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: 200,
  },
  replyAttachmentText: {
    fontSize: 12,
    flexShrink: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
