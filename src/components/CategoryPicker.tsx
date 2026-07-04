import { PickerField } from '@/components/PickerField';
import { getCategoryIcon } from '@/constants/categories';
import { useCategories } from '@/hooks/useCategories';
import type { TransactionType } from '@/types/database.types';

interface CategoryPickerProps {
  type: TransactionType;
  value: string | null;
  onSelect: (categoryId: string) => void;
  error?: string;
}

export function CategoryPicker({ type, value, onSelect, error }: CategoryPickerProps) {
  const { data: categories } = useCategories(type);

  return (
    <PickerField
      label="Categoria"
      placeholder="Selecione uma categoria"
      value={value}
      onSelect={onSelect}
      error={error}
      options={(categories ?? []).map((c) => ({
        value: c.id,
        label: c.name,
        icon: getCategoryIcon(c.icon),
      }))}
    />
  );
}
