import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { formatDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (_event, selectedDate) => {
          if (selectedDate) onChange(selectedDate);
        },
      });
      return;
    }
    setOpen(true);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={handlePress}>
        <Feather name="calendar" size={16} color={colors.textMuted} />
        <Text style={styles.value}>{formatDate(value)}</Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
              <View style={styles.backdropTint} />
            </Pressable>
            <View style={styles.sheet}>
              <DateTimePicker
                value={value}
                mode="date"
                display="inline"
                onChange={(_event, selectedDate) => {
                  if (selectedDate) onChange(selectedDate);
                }}
              />
              <Pressable style={styles.doneButton} onPress={() => setOpen(false)}>
                <Text style={styles.doneButtonText}>Concluir</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  field: { marginBottom: Spacing.md },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: Spacing.xs },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  value: { fontSize: 16, color: colors.text },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  doneButton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm },
  doneButtonText: { color: '#fff', fontWeight: '600' },
});
