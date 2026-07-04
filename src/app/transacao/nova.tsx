import { ScrollView, StyleSheet } from 'react-native';

import { TransactionForm } from '@/components/TransactionForm';
import { Colors } from '@/constants/theme';

export default function NovaTransacaoScreen() {
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <TransactionForm />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
