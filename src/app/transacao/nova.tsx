import { ScrollView, StyleSheet } from 'react-native';

import { TransactionForm } from '@/components/TransactionForm';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

export default function NovaTransacaoScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TransactionForm />
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
