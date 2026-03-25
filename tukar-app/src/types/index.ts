import { z } from 'zod';

// ─────────────────────────────────────────────
// 1. PRIMITIVE UNION TYPES
// ─────────────────────────────────────────────

export type WalletType = 'kartu' | 'tunai';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type SubscriptionStatus = 'Lunas' | 'Belum Dibayar' | 'Mendatang';
export type CategoryType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
export type ThemeType = 'light' | 'dark';

// ─────────────────────────────────────────────
// 2. SUPABASE DB ENTITY TYPES
// ─────────────────────────────────────────────

export interface Wallet {
    id: string;
    user_id: string;
    name: string;
    wallet_type: string;
    balance: number;
    parent_wallet_id?: string | null;
}

export interface Transaction {
    id: string;
    user_id: string;
    wallet_id: string;
    destination_wallet_id?: string | null;
    amount: number;
    category: string;
    date: string;
    /** App-level mapped type (lowercase) */
    type: TransactionType;
    title: string;
    created_at?: string;
    /** Raw DB column (UPPERCASE) — prefer `type` for display logic */
    transaction_type?: string;
    icon_name?: string;
    color_hex?: string;
    location?: string;
    notes?: string;
    category_id?: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    service_name: string;
    amount: number;
    due_date: string;
    status: SubscriptionStatus;
    logo_url?: string;
    /** Runtime alias — some DB rows return `service_name` as `name` */
    name?: string;
    /** Parsed numeric billing day (1-31) */
    billing_date?: number;
}

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    category: string;
    target_amount: number;
    current_amount: number;
    icon?: string;
}

export interface Category {
    id: string;
    user_id: string;
    name: string;
    type: CategoryType;
    icon_name: string;
    color_hex: string;
    budget_limit?: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'assistant';
    content: string;
    /** @deprecated DB legacy field — use `role`. Will be removed in future. */
    sender?: string;
    /** @deprecated DB legacy field — use `content`. Will be removed in future. */
    text?: string;
    transactions?: AIExtractedTransaction[];
    time?: string;
    options?: string[];
}

// ─────────────────────────────────────────────
// 3. ZOD SCHEMAS & INFERRED TYPES
// ─────────────────────────────────────────────

export const AddTransactionSchema = z.object({
    wallet_id: z.string().uuid(),
    destination_wallet_id: z.string().uuid().nullable().optional(),
    amount: z.number().positive(),
    transaction_type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
    notes: z.string().optional(),
    category_id: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    date: z.string().optional(),
});

export type AddTransactionPayload = z.infer<typeof AddTransactionSchema>;

export const AddSubscriptionSchema = z.object({
    service_name: z.string().min(1),
    amount: z.number().positive(),
    due_date: z.string(),
    status: z.enum(['Lunas', 'Belum Dibayar', 'Mendatang']).optional(),
    logo_url: z.string().optional(),
});

export type AddSubscriptionPayload = z.infer<typeof AddSubscriptionSchema>;

// ─────────────────────────────────────────────
// 4. AI TYPES
// ─────────────────────────────────────────────

export interface ParsedAIInput {
    amount: number;
    category: string;
    categoryName: string;
    walletType: WalletType;
    wallet_id: string;
    title: string;
    type: TransactionType;
}

export interface AIExtractedTransaction {
    wallet_id: string;
    destination_wallet_id?: string | null;
    amount: number;
    transaction_type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
    notes: string;
    category_id?: string | null;
    location?: string | null;
}
export interface BudgetStatus {
    total: number;
    limit: number;
    remaining: number;
    isOverBudget: boolean;
    percentage: number;
}

// ─────────────────────────────────────────────
// 5. NAVIGATION TYPES
// ─────────────────────────────────────────────

export type RootStackParamList = {
    MainTabs: undefined;
    ChatScreen: undefined;
    Wishlist: undefined;
    AddTransactionScreen: { editData?: Transaction } | undefined;
    Subscriptions: undefined;
    ManageCategoriesScreen: undefined;
    ManageWalletsScreen: undefined;
    AddCategoryScreen: { type?: CategoryType; category?: Category } | undefined;
    AddWalletScreen: undefined;
    TransactionsHistoryScreen: undefined;
    AnalyticsScreen: undefined;
    WelcomeScreen: undefined;
    LoginScreen: undefined;
    SignupScreen: undefined;
};

