import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

import type { PaymentMethod } from '@/types/database.types';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

/** Mapeia o campo `icon` salvo no banco (ver seed_categories.sql) para um ícone Feather. */
export const CATEGORY_ICONS: Record<string, FeatherIconName> = {
  'shopping-cart': 'shopping-cart',
  truck: 'truck',
  film: 'film',
  heart: 'heart',
  home: 'home',
  book: 'book',
  coffee: 'coffee',
  'shopping-bag': 'shopping-bag',
  'file-text': 'file-text',
  repeat: 'repeat',
  'map-pin': 'map-pin',
  'more-horizontal': 'more-horizontal',
  'dollar-sign': 'dollar-sign',
  briefcase: 'briefcase',
  'trending-up': 'trending-up',
  gift: 'gift',
};

export const DEFAULT_CATEGORY_ICON: FeatherIconName = 'tag';

export function getCategoryIcon(icon: string | null | undefined): FeatherIconName {
  if (!icon) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICONS[icon] ?? DEFAULT_CATEGORY_ICON;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  'pix',
  'cartao_credito',
  'cartao_debito',
  'dinheiro',
  'boleto',
];
