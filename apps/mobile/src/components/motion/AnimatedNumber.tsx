import { useEffect } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  easing?: (t: number) => number;
}

/**
 * Animated counting number display.
 * Uses Reanimated 4 on the UI thread for zero JS-thread cost.
 */
export function AnimatedNumber({
  value,
  duration = 600,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
  style,
  easing = Easing.out(Easing.cubic),
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration, easing });
  }, [value, duration, easing, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    const formatted = animatedValue.value.toFixed(decimalPlaces);
    return {
      text: `${prefix}${formatted}${suffix}`,
      defaultValue: `${prefix}${formatted}${suffix}`,
    };
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[{ padding: 0, margin: 0 }, style]}
      animatedProps={animatedProps}
    />
  );
}
