import { Feather } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

export interface PickerOption {
  value: string;
  label: string;
  icon?: ComponentProps<typeof Feather>['name'];
}

interface PickerFieldProps {
  label: string;
  placeholder: string;
  value: string | null;
  options: PickerOption[];
  onSelect: (value: string) => void;
  error?: string;
  /** Conteúdo extra no rodapé do sheet; recebe uma função para fechar o sheet. */
  footer?: (close: () => void) => ReactNode;
}

export function PickerField({
  label,
  placeholder,
  value,
  options,
  onSelect,
  error,
  footer,
}: PickerFieldProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const close = () => setOpen(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.input, error && styles.inputError]}
        onPress={() => setOpen(true)}
      >
        {selected?.icon && <Feather name={selected.icon} size={16} color={colors.textMuted} />}
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Backdrop e sheet são irmãos (não pai/filho): cliques dentro do sheet
              nunca chegam ao backdrop, em qualquer plataforma (inclusive web). */}
          <Pressable style={StyleSheet.absoluteFill} onPress={close}>
            <View style={styles.backdropTint} />
          </Pressable>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    close();
                  }}
                >
                  {item.icon && <Feather name={item.icon} size={18} color={colors.text} />}
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </Pressable>
              )}
              style={{ maxHeight: 360 }}
            />
            {footer?.(close)}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  inputError: { borderColor: colors.danger },
  value: { flex: 1, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textMuted },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 4 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, color: colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionText: { flex: 1, fontSize: 15, color: colors.text },
});
