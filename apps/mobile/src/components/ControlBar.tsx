import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ControlBarProps {
  onToggleFacing: () => void;
  disabled?: boolean;
}

export function ControlBar({ onToggleFacing, disabled }: ControlBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onToggleFacing}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
        <Text style={styles.label}>Flip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  button: {
    alignItems: 'center',
    padding: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
});
