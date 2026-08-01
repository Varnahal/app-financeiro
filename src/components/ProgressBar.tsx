import { StyleSheet, View } from 'react-native';

import { type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

interface ProgressBarProps {
  /** Razão de preenchimento (0..1+); acima de 1 é limitado visualmente a 100%. */
  ratio: number;
  /** Cor da barra. Se omitida, usa o primary do tema. */
  color?: string;
}

export function ProgressBar({ ratio, color }: ProgressBarProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color ?? colors.primary },
        ]}
      />
    </View>
  );
}

/** Cor de progresso para metas de gasto: verde -> amarelo -> vermelho. */
export function spendingColor(ratio: number, colors: ThemeColors): string {
  if (ratio >= 1) return colors.danger;
  if (ratio >= 0.8) return '#F59E0B'; // âmbar de alerta
  return colors.success;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      height: 10,
      borderRadius: 6,
      backgroundColor: colors.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 6 },
  });
