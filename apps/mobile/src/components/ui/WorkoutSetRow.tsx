import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

interface WorkoutSetRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  rpe?: string;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onRpeChange?: (value: string) => void;
  completed?: boolean;
}

export function WorkoutSetRow({
  setNumber, weight, reps, rpe, onWeightChange, onRepsChange, onRpeChange, completed,
}: WorkoutSetRowProps) {
  return (
    <View style={[styles.row, completed && styles.completedRow]}>
      <View style={styles.setNum}>
        <Text style={[styles.setNumText, completed && styles.completedText]}>{setNumber}</Text>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>kg</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={onWeightChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>reps</Text>
        <TextInput
          style={styles.input}
          value={reps}
          onChangeText={onRepsChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>
      {onRpeChange && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>RPE</Text>
          <TextInput
            style={styles.input}
            value={rpe}
            onChangeText={onRpeChange}
            keyboardType="decimal-pad"
            placeholder="-"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  completedRow: { backgroundColor: colors.semantic.success + '10' },
  setNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  setNumText: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.text.secondary },
  completedText: { color: colors.semantic.success },
  inputGroup: { flex: 1, alignItems: 'center' },
  label: { fontSize: fontSize.xs, fontFamily: fontFamily.regular, color: colors.text.tertiary, marginBottom: 2 },
  input: {
    width: '100%',
    textAlign: 'center',
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
});
