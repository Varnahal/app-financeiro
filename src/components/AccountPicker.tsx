import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PickerField } from '@/components/PickerField';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import { showAlert } from '@/utils/alert';

interface AccountPickerProps {
  value: string | null;
  onSelect: (accountId: string) => void;
  error?: string;
}

export function AccountPicker({ value, onSelect, error }: AccountPickerProps) {
  const styles = useThemedStyles(makeStyles);
  const { data: accounts } = useAccounts();
  const createAccount = useCreateAccount();
  const [newName, setNewName] = useState('');

  async function handleQuickAdd(close: () => void) {
    if (!newName.trim()) return;
    try {
      const account = await createAccount.mutateAsync({ name: newName.trim(), kind: 'conta' });
      setNewName('');
      onSelect(account.id);
      close();
    } catch {
      showAlert('Erro', 'Não foi possível criar a conta. Tente novamente.');
    }
  }

  return (
    <PickerField
      label="Conta / Cartão"
      placeholder="Selecione uma conta"
      value={value}
      onSelect={onSelect}
      error={error}
      options={(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))}
      footer={(close) => (
        <View style={styles.quickAdd}>
          <TextInput
            style={styles.input}
            placeholder="+ Nova conta (ex: Nubank)"
            value={newName}
            onChangeText={setNewName}
          />
          <Pressable
            style={styles.addButton}
            onPress={() => handleQuickAdd(close)}
            disabled={createAccount.isPending}
          >
            {createAccount.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Adicionar</Text>
            )}
          </Pressable>
        </View>
      )}
    />
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  quickAdd: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
