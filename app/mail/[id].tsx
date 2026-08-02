import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ActionItems } from '@/components/mail/action-items';
import { AttachmentCard } from '@/components/mail/attachment-card';
import { ImportantTag } from '@/components/mail/important-tag';
import { SummaryBadge } from '@/components/mail/summary-badge';
import { ProfileAvatar } from '@/components/settings/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppHeader, HeaderIconButton } from '@/components/ui/app-header';
import { GlassCard } from '@/components/ui/glass-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getEmailById, markAsRead, sendReply, setArchived, setDeleted } from '@/services/mailService';
import type { ReplyAttachment } from '@/services/mailService';
import type { Email } from '@/types/mail';

function formatShortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EmailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [email, setEmail] = useState<Email | undefined | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<ReplyAttachment[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [showSenderEmail, setShowSenderEmail] = useState(false);
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const replyInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const expandForKeyboard = useCallback(() => {
    Animated.timing(shiftAnim, { toValue: windowHeight * 0.5, duration: 220, useNativeDriver: false }).start();
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [shiftAnim, windowHeight]);

  const collapseForKeyboard = useCallback(() => {
    Animated.timing(shiftAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  }, [shiftAnim]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', expandForKeyboard);
    const hideSub = Keyboard.addListener('keyboardDidHide', collapseForKeyboard);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [expandForKeyboard, collapseForKeyboard]);

  useEffect(() => {
    setShowSenderEmail(false);
    getEmailById(id).then((result) => {
      setEmail(result ?? undefined);
      setReplyText(result?.suggestedReply ?? '');
      setSendState(result?.replied ? 'sent' : 'idle');
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
    replyInputRef.current?.blur();
    Keyboard.dismiss();
    collapseForKeyboard();
    setSendState('sending');
    await sendReply(email.id, replyText, replyAttachments);
    setSendState('sent');
    setEmail((prev) => (prev ? { ...prev, replied: true } : prev));
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

  const handleAttach = async () => {
    setIsAttaching(true);
    try {
      // base64: true is required on web — expo-document-picker defaults
      // that to false there, and `File` from expo-file-system used below
      // for the native fallback is iOS/Android/tvOS only (it throws on web).
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        base64: true,
      });
      if (result.canceled) return;

      const picked = await Promise.all(
        result.assets.map(async (asset): Promise<ReplyAttachment> => {
          // Web: expo-document-picker returns a `data:<mime>;base64,<data>`
          // URL, not raw base64 — strip the prefix so the backend always
          // gets a plain base64 payload it can decode directly.
          const raw = asset.base64 ?? (await new File(asset.uri).base64());
          return {
            name: asset.name,
            mimeType: asset.mimeType ?? 'application/octet-stream',
            base64: raw.replace(/^data:[^;]*;base64,/, ''),
          };
        })
      );
      setReplyAttachments((prev) => [...prev, ...picked]);
    } finally {
      setIsAttaching(false);
    }
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ThemedView style={styles.container}>
      <AppHeader
        leading={
          <HeaderIconButton onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={18} color={Colors[colorScheme].text} />
          </HeaderIconButton>
        }
        trailing={
          <>
            <HeaderIconButton onPress={handleToggleArchive}>
              <MaterialCommunityIcons
                name={email.archived ? 'archive-arrow-up' : 'archive-arrow-up-outline'}
                size={18}
                color={Colors[colorScheme].icon}
              />
            </HeaderIconButton>
            <HeaderIconButton onPress={handleToggleDelete}>
              <IconSymbol
                name={email.deleted ? 'trash.slash' : 'trash'}
                size={18}
                color={Colors[colorScheme].icon}
              />
            </HeaderIconButton>
          </>
        }
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <View style={styles.senderRow}>
            <View style={styles.senderInfo}>
              <ProfileAvatar name={email.sender.name} size={44} />
              <View style={styles.senderTextColumn}>
                <Pressable
                  onPress={() => setShowSenderEmail((v) => !v)}
                  hitSlop={6}
                  style={styles.senderNameRow}>
                  <ThemedText type="defaultSemiBold" style={styles.senderName}>
                    {email.sender.name}
                  </ThemedText>
                  <IconSymbol
                    name={showSenderEmail ? 'chevron.up' : 'chevron.down'}
                    size={16}
                    color={Colors[colorScheme].icon}
                    style={styles.senderChevron}
                  />
                </Pressable>
                <ThemedText style={[styles.senderDateTime, { color: Colors[colorScheme].icon }]}>
                  {formatFullDate(email.timestamp)} · {formatShortTime(email.timestamp)}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={() => Linking.openURL(email.gmailLink)}
              style={[styles.openInGmailButton, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].card }]}>
              <IconSymbol name="arrow.up.right.square" size={13} color={Colors[colorScheme].text} />
              <ThemedText type="defaultSemiBold" style={styles.openInGmailText}>
                Open in Gmail
              </ThemedText>
            </Pressable>
          </View>
          {showSenderEmail ? (
            <ThemedText
              numberOfLines={1}
              style={[
                styles.senderEmailReveal,
                {
                  maxWidth: windowWidth - 60,
                  color: Colors[colorScheme].text,
                  backgroundColor: Colors[colorScheme].card,
                  borderColor: Colors[colorScheme].border,
                },
              ]}>
              {email.sender.email}
            </ThemedText>
          ) : null}
          <View style={styles.subjectRow}>
            <ThemedText type="title" style={styles.subject}>
              {email.subject}
            </ThemedText>
            <ImportantTag important={email.important} size="md" />
          </View>
        </View>

        <SummaryBadge text={detailedSummary.keyPoints.join(' ')} expanded />

        {hasStructuredDetails ? (
          <GlassCard radius={12}>
            <View style={styles.detailsBlock}>
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
          </GlassCard>
        ) : null}

        <ActionItems items={email.actionItems} />

        <ThemedText style={styles.body}>{email.body}</ThemedText>

        {email.attachments.length > 0 ? (
          <View style={styles.attachments}>
            {email.attachments.map((attachment) => (
              <AttachmentCard key={attachment.fileName} attachment={attachment} />
            ))}
          </View>
        ) : null}

        <GlassCard
          radius={18}
          intensity={45}
          style={styles.replySectionWrap}
          surfaceStyle={{ borderColor: Colors[colorScheme].tint, borderWidth: 1.5 }}>
          <View style={styles.replySection}>
          <ThemedText type="defaultSemiBold" style={styles.replyLabel}>
            Suggested reply
          </ThemedText>
          <TextInput
            ref={replyInputRef}
            value={replyText}
            onChangeText={setReplyText}
            onFocus={expandForKeyboard}
            onBlur={collapseForKeyboard}
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

          <Pressable onPress={handleAttach} disabled={isAttaching} style={styles.attachButton} hitSlop={6}>
            <IconSymbol name="paperclip" size={15} color={Colors[colorScheme].tint} />
            <ThemedText type="defaultSemiBold" style={[styles.attachLabel, { color: Colors[colorScheme].tint }]}>
              {isAttaching ? 'Attaching…' : 'Attach files'}
            </ThemedText>
          </Pressable>

          {replyAttachments.length > 0 ? (
            <View style={styles.replyAttachmentsRow}>
              {replyAttachments.map((attachment, index) => (
                <View
                  key={`${attachment.name}-${index}`}
                  style={[
                    styles.replyAttachmentChip,
                    { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                  ]}>
                  <IconSymbol name="doc.text.fill" size={13} color={Colors[colorScheme].tint} />
                  <ThemedText style={styles.replyAttachmentText} numberOfLines={1}>
                    {attachment.name}
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
        </GlassCard>

        <Animated.View style={{ height: shiftAnim }} />
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
    position: 'relative',
  },
  senderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexShrink: 1,
  },
  senderTextColumn: {
    flexShrink: 1,
    gap: 2,
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  senderName: {
    flexShrink: 1,
    fontSize: 18,
  },
  senderChevron: {
    flexShrink: 0,
    marginTop: 3,
  },
  senderDateTime: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  senderEmailReveal: {
    position: 'absolute',
    top: 46,
    left: 56,
    zIndex: 20,
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
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
  openInGmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  openInGmailText: {
    fontSize: 12,
  },
  detailsBlock: {
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
  replySectionWrap: {
    marginTop: 8,
  },
  replySection: {
    padding: 16,
    gap: 12,
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
