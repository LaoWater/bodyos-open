import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

interface DurationTimerProps {
  isRunning: boolean;
}

export function DurationTimer({ isRunning }: DurationTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return <Text style={styles.timer}>{display}</Text>;
}

const styles = StyleSheet.create({
  timer: {
    color: '#ff3b30',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
});
