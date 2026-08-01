import { StyleSheet, Text, View } from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { dayjs } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

// @react-native-community/datetimepicker não tem build para web, então no preview
// web usamos um input HTML nativo de data (funciona bem no Chrome/Firefox/Safari).
export function DateField({ label, value, onChange }: DateFieldProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.input}>
        <input
          type="date"
          value={dayjs(value).format('YYYY-MM-DD')}
          onChange={(e) => {
            const parsed = dayjs(e.target.value, 'YYYY-MM-DD');
            if (parsed.isValid()) onChange(parsed.toDate());
          }}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: 16,
            color: colors.text,
            backgroundColor: 'transparent',
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  field: { marginBottom: Spacing.md },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: Spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
});
