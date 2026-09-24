import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass/GlassCard';
import { GradientAccent } from '../glass/GradientAccent';
import { colors, textStyles, spacing } from '../../theme';
import type { AIMessageFeedback } from '../../types/models';

interface ChatBubbleProps {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: string;
  messageId?: string;
  feedback?: AIMessageFeedback;
  onFeedback?: (messageId: string, feedback: AIMessageFeedback) => void;
}

export function ChatBubble({ role, content, timestamp, messageId, feedback, onFeedback }: ChatBubbleProps) {
  const isAssistant = role === 'assistant';

  if (isAssistant) {
    return (
      <View style={styles.assistantRow}>
        <GradientAccent preset="teal" size={28}>
          <Ionicons name="fitness" size={14} color={colors.text.inverse} />
        </GradientAccent>
        <View style={styles.assistantCol}>
          <GlassCard variant="elevated" padding="md" innerGlow="teal" style={styles.assistantBubble}>
            <Text style={styles.assistantText}>{content}</Text>
            {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
          </GlassCard>
          {onFeedback && messageId && (
            <View style={styles.feedbackRow}>
              <TouchableOpacity
                onPress={() => onFeedback(messageId, feedback === 'positive' ? null : 'positive')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={feedback === 'positive' ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={14}
                  color={feedback === 'positive' ? colors.semantic.success : colors.text.tertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onFeedback(messageId, feedback === 'negative' ? null : 'negative')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={feedback === 'negative' ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={14}
                  color={feedback === 'negative' ? colors.secondary.primary : colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{content}</Text>
        {timestamp && <Text style={styles.timestampRight}>{timestamp}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-start' },
  assistantCol: { flex: 1, maxWidth: '85%' },
  assistantBubble: {},
  assistantText: { ...textStyles.body, color: colors.text.primary },
  feedbackRow: {
    flexDirection: 'row',
    gap: spacing.base,
    paddingLeft: spacing.sm,
    paddingTop: 4,
  },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  userBubble: {
    backgroundColor: colors.accent.primaryMuted,
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    maxWidth: '80%',
  },
  userText: { ...textStyles.body, color: colors.text.primary },
  timestamp: { ...textStyles.small, color: colors.text.tertiary, marginTop: spacing.xs },
  timestampRight: { ...textStyles.small, color: colors.text.tertiary, marginTop: spacing.xs, textAlign: 'right' },
});
