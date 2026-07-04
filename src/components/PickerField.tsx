import { Feather } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

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
  footer?: ReactNode;
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
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.input, error && styles.inputError]}
        onPress={() => setOpen(true)}
      >
        {selected?.icon && <Feather name={selected.icon} size={16} color={Colors.textMuted} />}
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={Colors.textMuted} />
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  {item.icon && <Feather name={item.icon} size={18} color={Colors.text} />}
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value && (
                    <Feather name="check" size={18} color={Colors.primary} />
                  )}
                </Pressable>
              )}
              style={{ maxHeight: 360 }}
            />
            {footer}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: Spacing.md },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xs },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  inputError: { borderColor: Colors.danger },
  value: { flex: 1, fontSize: 16, color: Colors.text },
  placeholder: { color: Colors.textMuted },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, color: Colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionText: { flex: 1, fontSize: 15, color: Colors.text },
});
