import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

// New V2 Modular Slices
import { createWalletSlice, WalletSlice } from './slices/walletSlice';
import { createTransactionSlice, TransactionSlice } from './slices/transactionSlice';
import { createCategorySlice, CategorySlice } from './slices/categorySlice';
import { createSubscriptionSlice, SubscriptionSlice } from './slices/subscriptionSlice';
import { createGoalSlice, GoalSlice } from './slices/goalSlice';
import { createReportSlice, ReportSlice } from './slices/reportSlice';
import { createChatSliceV2, ChatSliceV2State } from './slices/chatSliceV2';
import { createUISliceV2, UISliceV2 } from './slices/uiSlice';
import { createSettingsSliceV2, SettingsSliceV2 } from './slices/settingsSlice';

// Combined App State V2 (Unified)
export type AppStateV2 = WalletSlice &
    TransactionSlice &
    CategorySlice &
    SubscriptionSlice &
    GoalSlice &
    ReportSlice &
    ChatSliceV2State &
    UISliceV2 &
    SettingsSliceV2;

export const useStoreV2 = create<AppStateV2>()(
    persist(
        (set, get, api) => ({
            ...createWalletSlice(set, get, api as any),
            ...createTransactionSlice(set, get, api as any),
            ...createCategorySlice(set, get, api as any),
            ...createSubscriptionSlice(set, get, api as any),
            ...createGoalSlice(set, get, api as any),
            ...createReportSlice(set, get, api as any),
            ...createChatSliceV2(set, get, api as any),
            ...createUISliceV2(set, get, api as any),
            ...createSettingsSliceV2(set, get, api as any),
        }),
        {
            name: 'tukar-storage-v2',
            storage: createJSONStorage(() => AsyncStorage),

            partialize: (state) => ({
                // ─── Data master ────────────────────────
                wallets: state.wallets,
                subscriptions: state.subscriptions,
                goals: state.goals,
                categories: state.categories,

                // ─── Settings / UI ──────────────────────
                currentTheme: state.currentTheme,
                remindersEnabled: state.remindersEnabled,
                language: state.language,
                biometricEnabled: state.biometricEnabled,
                isHideBalance: state.isHideBalance,

                // ─── Pagination & Chat ────────────────────
                transactions: state.transactions?.slice(0, state.transactionPagination?.itemsPerPage || 15) || [],
                transactionPagination: state.transactionPagination,
                chatHistory: state.chatHistory?.slice(-50) || [],
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.currentTheme) {
                    colorScheme.set(state.currentTheme);
                }
            }
        }
    )
);
