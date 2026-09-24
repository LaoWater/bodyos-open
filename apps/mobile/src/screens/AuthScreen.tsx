import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/glass/GlassCard';
import { useAuth } from '../context/AuthContext';
import { colors, textStyles, spacing, fontFamily, fontSize, borderRadius } from '../theme';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    const result = mode === 'signin'
      ? await signIn(trimmedEmail, password)
      : await signUp(trimmedEmail, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signup') {
      setError(null);
    }

    // Auth state change in context will propagate; go back
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Coming Soon', 'Google Sign-In will be available in a future update.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Close button */}
        <Pressable
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[...colors.gradients.tealCyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="lock-closed" size={24} color={colors.text.inverse} />
            </LinearGradient>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Sign in to enable live AI coaching'
                : 'Sign up to unlock real-time AI coaching'}
            </Text>
          </View>

          {/* Form */}
          <GlassCard variant="elevated" padding="lg">
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.tertiary}
                  secureTextEntry
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </View>

              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="warning-outline" size={14} color={colors.semantic.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  loading && styles.submitBtnDisabled,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={[...colors.gradients.tealCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {loading ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </Text>
                )}
              </Pressable>
            </View>
          </GlassCard>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In */}
          <Pressable
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && styles.googleBtnPressed,
            ]}
          >
            <GoogleIcon size={20} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>

          {/* Toggle mode */}
          <Pressable onPress={toggleMode} style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {mode === 'signin'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>
            <Text style={styles.toggleLink}>
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </Text>
          </Pressable>

          {/* Continue as guest */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.guestRow}
          >
            <Text style={styles.guestText}>Continue as Guest</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...textStyles.h1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.base,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.semantic.error,
    flex: 1,
  },
  submitBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.inverse,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  toggleLink: {
    ...textStyles.body,
    color: colors.accent.primary,
    fontFamily: fontFamily.semiBold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glass.border,
  },
  dividerText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  googleBtnPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(21, 23, 28, 0.95)',
  },
  googleBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  guestRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  guestText: {
    ...textStyles.body,
    color: colors.text.tertiary,
  },
});
