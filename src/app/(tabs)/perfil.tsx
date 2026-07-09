import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useRenameAccount,
} from '@/hooks/useAccounts';
import { showAlert, showConfirm } from '@/utils/alert';
import type { Account, AccountKind } from '@/types/database.types';

const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  conta: 'Conta',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
};

const ACCOUNT_KINDS: AccountKind[] = ['conta', 'cartao', 'dinheiro', 'outro'];

function AccountRow({ account, onRename }: { account: Account; onRename: () => void }) {
  const deleteAccount = useDeleteAccount();

  async function handleDelete() {
    const confirmed = await showConfirm(
      'Excluir conta',
      `"${account.name}" vai sumir da lista e dos formulários, mas as transações já registradas continuam mostrando o nome dela. Deseja excluir?`,
      { confirmText: 'Excluir', destructive: true }
    );
    if (!confirmed) return;
    try {
      await deleteAccount.mutateAsync(account.id);
    } catch {
      showAlert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
    }
  }

  return (
    <View style={styles.accountRow}>
      <View style={styles.accountIcon}>
        <Feather name={account.kind === 'cartao' ? 'credit-card' : 'briefcase'} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountKind}>{ACCOUNT_KIND_LABELS[account.kind]}</Text>
      </View>
      <View style={styles.accountActions}>
        <Pressable style={styles.accountActionButton} onPress={onRename}>
          <Feather name="edit-2" size={16} color={Colors.primary} />
        </Pressable>
        <Pressable
          style={styles.accountActionButton}
          onPress={handleDelete}
          disabled={deleteAccount.isPending}
        >
          {deleteAccount.isPending ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <Feather name="trash-2" size={16} color={Colors.danger} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const renameAccount = useRenameAccount();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('conta');
  const [renaming, setRenaming] = useState<Account | null>(null);
  const [renameText, setRenameText] = useState('');

  function openRename(account: Account) {
    setRenaming(account);
    setRenameText(account.name);
  }

  async function handleSaveRename() {
    if (!renaming) return;
    if (!renameText.trim()) {
      showAlert('Ops', 'O nome não pode ficar vazio.');
      return;
    }
    try {
      await renameAccount.mutateAsync({ accountId: renaming.id, name: renameText.trim() });
      setRenaming(null);
    } catch {
      showAlert('Erro', 'Não foi possível renomear a conta. Tente novamente.');
    }
  }

  async function handleAddAccount() {
    if (!name.trim()) {
      showAlert('Ops', 'Dê um nome para a conta (ex: Nubank, Dinheiro).');
      return;
    }
    try {
      await createAccount.mutateAsync({ name: name.trim(), kind });
      setName('');
      setKind('conta');
      setShowForm(false);
    } catch {
      showAlert('Erro', 'Não foi possível criar a conta. Tente novamente.');
    }
  }

  async function handleSignOut() {
    const confirmed = await showConfirm('Sair', 'Deseja realmente sair da sua conta?', {
      confirmText: 'Sair',
      destructive: true,
    });
    if (confirmed) await signOut();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={accounts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AccountRow account={item} onRename={() => openRename(item)} />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Feather name="user" size={28} color="#fff" />
              </View>
              <Text style={styles.email}>{user?.email}</Text>
            </View>

            <Text style={styles.sectionTitle}>Minhas Contas e Cartões</Text>
            {isLoading && <ActivityIndicator style={{ marginVertical: Spacing.md }} />}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>
              Você ainda não tem nenhuma conta cadastrada. Adicione uma abaixo.
            </Text>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {showForm ? (
              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Nome (ex: Nubank, Dinheiro)"
                  value={name}
                  onChangeText={setName}
                />
                <View style={styles.kindRow}>
                  {ACCOUNT_KINDS.map((k) => (
                    <Pressable
                      key={k}
                      style={[styles.kindChip, kind === k && styles.kindChipActive]}
                      onPress={() => setKind(k)}
                    >
                      <Text style={[styles.kindChipText, kind === k && styles.kindChipTextActive]}>
                        {ACCOUNT_KIND_LABELS[k]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={styles.saveButton}
                  onPress={handleAddAccount}
                  disabled={createAccount.isPending}
                >
                  {createAccount.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar conta</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
                <Feather name="plus" size={18} color={Colors.primary} />
                <Text style={styles.addButtonText}>Nova conta</Text>
              </Pressable>
            )}

            <Pressable style={styles.menuRow} onPress={() => router.push('/recorrentes')}>
              <View style={styles.menuIcon}>
                <Feather name="repeat" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>Recorrentes</Text>
                <Text style={styles.menuSubtitle}>Salário e contas fixas mensais</Text>
              </View>
              <Feather name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>

            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Feather name="log-out" size={18} color={Colors.danger} />
              <Text style={styles.signOutText}>Sair</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={!!renaming}
        animationType="slide"
        transparent
        onRequestClose={() => setRenaming(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRenaming(null)}>
            <View style={styles.backdropTint} />
          </Pressable>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Renomear conta</Text>
            <Text style={styles.sheetHint}>
              O novo nome vale para tudo, inclusive para as transações já registradas.
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Nome da conta"
              autoFocus
            />
            <Pressable
              style={styles.saveButton}
              onPress={handleSaveRename}
              disabled={renameAccount.isPending}
            >
              {renameAccount.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar nome</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  email: { fontSize: 16, fontWeight: '600', color: Colors.text },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  emptyText: { color: Colors.textMuted, fontSize: 14, marginBottom: Spacing.md },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  accountKind: { fontSize: 13, color: Colors.textMuted },
  accountActions: { flexDirection: 'row', gap: Spacing.sm },
  accountActionButton: { padding: 6 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdropTint: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sheetHint: { color: Colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: Spacing.md },
  sheetInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  footer: { marginTop: Spacing.md, gap: Spacing.md },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  addButtonText: { color: Colors.primary, fontWeight: '600' },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
  },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  kindChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kindChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kindChipText: { fontSize: 13, color: Colors.textMuted },
  kindChipTextActive: { color: '#fff', fontWeight: '600' },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  menuSubtitle: { fontSize: 13, color: Colors.textMuted },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 12,
  },
  signOutText: { color: Colors.danger, fontWeight: '600' },
});
