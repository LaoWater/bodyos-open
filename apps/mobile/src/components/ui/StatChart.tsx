import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient as SvgGradient, Stop, Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

interface DataPoint {
  label: string;
  value: number;
}

interface StatChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  color?: string;
}

export function StatChart({ data, title, height = 160, color = colors.accent.primary }: StatChartProps) {
  if (data.length < 2) return null;

  const width = 300;
  const padding = { top: 10, right: 10, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - min) / range) * chartH;
    return `${x},${y}`;
  }).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const y = padding.top + chartH * (1 - pct);
    const val = Math.round(min + range * pct);
    return { y, val };
  });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {gridLines.map((g, i) => (
          <Line key={i} x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke={colors.background.tertiary} strokeWidth={0.5} />
        ))}
        {gridLines.map((g, i) => (
          <SvgText key={`l${i}`} x={padding.left - 5} y={g.y + 4} fill={colors.text.tertiary} fontSize={9} textAnchor="end" fontFamily={fontFamily.regular}>
            {g.val}
          </SvgText>
        ))}

        <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => {
          const x = padding.left + (i / (data.length - 1)) * chartW;
          return (
            <SvgText key={`xl${i}`} x={x} y={height - 5} fill={colors.text.tertiary} fontSize={9} textAnchor="middle" fontFamily={fontFamily.regular}>
              {d.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  title: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary, marginBottom: spacing.sm },
});
