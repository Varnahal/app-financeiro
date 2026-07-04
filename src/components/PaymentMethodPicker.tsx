import { PickerField } from '@/components/PickerField';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/constants/categories';
import type { PaymentMethod } from '@/types/database.types';

interface PaymentMethodPickerProps {
  value: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  error?: string;
}

export function PaymentMethodPicker({ value, onSelect, error }: PaymentMethodPickerProps) {
  return (
    <PickerField
      label="Forma de pagamento"
      placeholder="Selecione a forma de pagamento"
      value={value}
      onSelect={(v) => onSelect(v as PaymentMethod)}
      error={error}
      options={PAYMENT_METHODS.map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }))}
    />
  );
}
