import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GradientAccent } from '../components/glass/GradientAccent';
import { ChatBubble } from '../components/ui/ChatBubble';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../context/AuthContext';
import { colors, textStyles, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import type { AIMessage, AIMessageFeedback } from '../types/models';
import type { RootStackParamList } from '../navigation/types';

const SUGGESTIONS = [
  'How can I improve my posture?',
  'Give me a shoulder routine',
  'What stretches should I do?',
  'Tips for better bench press form',
];

export function AssistantScreen() {
  const {
    conversations,
    activeConversation,
    loading,
    sending,
    isDemo,
    error,
    sendMessage,
    exitDemo,
    newConversation,
    selectConversation,
    submitFeedback,
    clearError,
  } = useAI();
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [input, setInput] = useState('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [pendingGoLive, setPendingGoLive] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // After returning from Auth screen, auto-trigger Go Live if pending
  useEffect(() => {
    if (pendingGoLive && isAuthenticated) {
      setPendingGoLive(false);
      exitDemo();
    }
  }, [pendingGoLive, isAuthenticated, exitDemo]);

  const handleGoLive = useCallback(async () => {
    const result = await exitDemo();
    if (result === 'needs_auth') {
      setPendingGoLive(true);
      navigation.navigate('Auth');
    }
  }, [exitDemo, navigation]);

  const messages = activeConversation?.messages ?? [];

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendMessage(text);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const handleFeedback = useCallback(
    (messageId: string, feedback: AIMessageFeedback) => {
      submitFeedback(messageId, feedback);
    },
    [submitFeedback],
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item }: { item: AIMessage }) => (
    <ChatBubble
      role={item.role}
      content={item.content}
      timestamp={formatTime(item.createdAt)}
      messageId={item.id}
      feedback={item.feedback}
      onFeedback={!isDemo ? handleFeedback : undefined}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScreenContainer scrollable={false} showConstellation={false}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={[...colors.gradients.heroTeal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.header}>
            <GradientAccent preset="teal" size={32}>
              <Ionicons name="sparkles" size={16} color={colors.text.inverse} />
            </GradientAccent>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                BodyOS Coach{isDemo ? ' (Demo)' : ''}
              </Text>
              {!isDemo && <View style={styles.liveDot} />}
            </View>
            <View style={styles.headerActions}>
              {!isDemo && (
                <TouchableOpacity
                  onPress={() => newConversation()}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={22} color={colors.text.primary} />
                </TouchableOpacity>
              )}
              {!isDemo && conversations.length > 1 && (
                <TouchableOpacity
                  onPress={() => setHistoryVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="time-outline" size={22} color={colors.text.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Demo Banner */}
        {isDemo && (
          <GlassCard variant="default" padding="md" style={styles.demoBanner}>
            <View style={styles.demoBannerContent}>
              <View style={styles.demoBannerTextCol}>
                <Text style={styles.demoBannerTitle}>Demo Mode</Text>
                <Text style={styles.demoBannerDesc}>
                  Try the coach with sample responses. Enter real chat for AI-powered coaching.
                </Text>
              </View>
              <TouchableOpacity onPress={handleGoLive} style={styles.enterRealBtn}>
                <LinearGradient
                  colors={[...colors.gradients.tealCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.md }]}
                />
                <Text style={styles.enterRealBtnText}>Go Live</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Error Banner */}
        {error && (
          <TouchableOpacity onPress={clearError} style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Ionicons name="close" size={14} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}

        {/* Messages */}
        <View style={styles.chatArea}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accent.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyChatText}>
                {isDemo
                  ? 'Start a conversation with your AI coach'
                  : 'Your BodyOS coach is ready. Ask anything about fitness, posture, or your training plan.'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        {/* Typing indicator */}
        {sending && (
          <View style={styles.typingRow}>
            <GradientAccent preset="teal" size={20}>
              <Ionicons name="fitness" size={10} color={colors.text.inverse} />
            </GradientAccent>
            <Text style={styles.typingText}>
              {isDemo ? 'Coach is thinking...' : 'Coach is generating a response...'}
            </Text>
          </View>
        )}

        {/* Suggestions */}
        {messages.length <= 2 && (
          <>
            <Text style={styles.suggestionsLabel}>Try asking:</Text>
            <FlatList
              horizontal
              data={SUGGESTIONS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsRow}
              renderItem={({ item }) => (
                <GlassButton
                  title={item}
                  onPress={() => handleSuggestion(item)}
                  variant="outline"
                  size="sm"
                  style={styles.chip}
                />
              )}
            />
          </>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <GlassCard variant="default" padding="sm" style={styles.inputCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Ask your coach..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!input.trim() || sending}
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              >
                <LinearGradient
                  colors={[...colors.gradients.tealCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                />
                <Ionicons name="send" size={16} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Conversation History Modal */}
        <Modal
          visible={historyVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setHistoryVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Conversations</Text>
                <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.historyItem,
                      item.id === activeConversation?.id && styles.historyItemActive,
                    ]}
                    onPress={() => {
                      selectConversation(item.id);
                      setHistoryVisible(false);
                    }}
                  >
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyDate}>{formatTime(item.updatedAt)}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  headerWrap: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'center',
  },

  // Demo banner
  demoBanner: {
    marginBottom: spacing.md,
  },
  demoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  demoBannerTextCol: {
    flex: 1,
  },
  demoBannerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: 2,
  },
  demoBannerDesc: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  enterRealBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  enterRealBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.semantic.error,
    flex: 1,
  },

  chatArea: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyChatText: {
    ...textStyles.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  messageList: {
    paddingBottom: spacing.md,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  typingText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  suggestionsLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  suggestionsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  inputBar: {
    paddingBottom: spacing.sm,
  },
  inputCard: {},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.primary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },

  // History modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  historyItem: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.glass.borderSubtle,
  },
  historyItemActive: {
    backgroundColor: colors.accent.primaryMuted,
  },
  historyTitle: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  historyDate: {
    ...textStyles.small,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});
