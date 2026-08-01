// Tipos manuais espelhando o schema em supabase/migrations/.
// Se preferir, depois de criar o projeto rode:
//   npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.types.ts
// para gerar este arquivo automaticamente a partir do banco real.
//
// Nota: usamos `type` (não `interface`) porque o supabase-js exige que cada tabela
// satisfaça `Record<string, unknown>` — TypeScript só reconhece essa compatibilidade
// estrutural para type literals, não para interfaces.

export type TransactionType = 'receita' | 'despesa';
export type CategoryKind = 'receita' | 'despesa' | 'ambos';
export type AccountKind = 'conta' | 'cartao' | 'dinheiro' | 'outro';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto';

export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
};

export type Account = {
  id: string;
  user_id: string;
  name: string;
  kind: AccountKind;
  color: string | null;
  archived: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  kind: CategoryKind;
  created_at: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  description: string;
  total_amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  payment_method: PaymentMethod;
  purchase_date: string;
  num_installments: number;
  recurring_item_id: string | null;
  created_at: string;
};

export type RecurringItem = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  payment_method: PaymentMethod;
  day_of_month: number;
  start_month: string;
  end_month: string | null;
  active: boolean;
  created_at: string;
};

export type GoalKind = 'gasto' | 'caixinha';

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  kind: GoalKind;
  target_amount: number | null;
  filter_payment_methods: PaymentMethod[];
  filter_category_ids: string[];
  filter_account_ids: string[];
  archived: boolean;
  created_at: string;
};

export type GoalContribution = {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  purchase_id: string;
  category_id: string;
  account_id: string;
  installment_number: number;
  installments_total: number;
  amount: number;
  due_date: string;
  type: TransactionType;
  description: string;
  created_at: string;
};

export type TransactionWithRelations = Transaction & {
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null;
  account: Pick<Account, 'id' | 'name' | 'kind' | 'color'> | null;
  purchase: Pick<
    Purchase,
    'payment_method' | 'description' | 'purchase_date' | 'num_installments' | 'total_amount' | 'recurring_item_id'
  > | null;
};

export type CreatePurchaseParams = {
  p_description: string;
  p_total_amount: number;
  p_type: TransactionType;
  p_category_id: string;
  p_account_id: string;
  p_payment_method: PaymentMethod;
  p_purchase_date: string;
  p_num_installments: number;
};

export type UpdatePurchaseParams = {
  p_purchase_id: string;
  p_description: string;
  p_total_amount: number;
  p_type: TransactionType;
  p_category_id: string;
  p_account_id: string;
  p_payment_method: PaymentMethod;
  p_purchase_date: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id' | 'created_at' | 'archived'> & { archived?: boolean };
        Update: Partial<Account>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Category>;
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, 'id' | 'created_at'>;
        Update: Partial<Purchase>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Transaction>;
        Relationships: [];
      };
      recurring_items: {
        Row: RecurringItem;
        Insert: Omit<RecurringItem, 'id' | 'created_at' | 'start_month' | 'end_month' | 'active'> &
          Partial<Pick<RecurringItem, 'start_month' | 'end_month' | 'active'>>;
        Update: Partial<RecurringItem>;
        Relationships: [];
      };
      goals: {
        Row: Goal;
        Insert: Omit<
          Goal,
          'id' | 'created_at' | 'archived' | 'filter_payment_methods' | 'filter_category_ids' | 'filter_account_ids'
        > &
          Partial<
            Pick<
              Goal,
              'archived' | 'filter_payment_methods' | 'filter_category_ids' | 'filter_account_ids'
            >
          >;
        Update: Partial<Goal>;
        Relationships: [];
      };
      goal_contributions: {
        Row: GoalContribution;
        Insert: Omit<GoalContribution, 'id' | 'created_at' | 'date' | 'note'> &
          Partial<Pick<GoalContribution, 'date' | 'note'>>;
        Update: Partial<GoalContribution>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_purchase_with_installments: {
        Args: CreatePurchaseParams;
        Returns: string;
      };
      update_purchase_fields: {
        Args: UpdatePurchaseParams;
        Returns: undefined;
      };
      materialize_recurring_items: {
        Args: Record<string, never>;
        Returns: number;
      };
      update_recurring_item_amount: {
        Args: { p_item_id: string; p_amount: number };
        Returns: undefined;
      };
    };
  };
};
