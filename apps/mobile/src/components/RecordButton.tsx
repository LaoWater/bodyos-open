import { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated, StyleSheet } from 'react-native';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RecordButton({ isRecording, onPress, disabled }: RecordButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={styles.outer}
    >
      <Animated.View
        style={[
          styles.inner,
          isRecording && styles.innerRecording,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {isRecording && <View style={styles.stopSquare} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff3b30',
  },
  innerRecording: {
    borderRadius: 8,
    width: 36,
    height: 36,
    backgroundColor: '#ff3b30',
  },
  stopSquare: {
    // The inner view itself becomes the stop square via innerRecording styles
  },
});
