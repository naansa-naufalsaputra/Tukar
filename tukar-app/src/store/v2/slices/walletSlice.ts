import { StateCreator } from 'zustand';
import { Wallet } from '@/types';
import { WalletService } from '@/services/walletService';

export interface WalletSlice {
    wallets: Wallet[];
    isLoadingWallets: boolean;
    fetchWallets: (userId: string) => Promise<void>;
    addWallet: (userId: string, walletData: Omit<Wallet, 'id' | 'user_id'>) => Promise<void>;
    syncWalletBalance: (userId: string, walletId: string) => Promise<void>;
}

export const createWalletSlice: StateCreator<
    WalletSlice,
    [['zustand/persist', unknown]],
    [],
    WalletSlice
> = (set, get) => ({
    wallets: [],
    isLoadingWallets: false,

    fetchWallets: async (userId: string) => {
        set({ isLoadingWallets: true });
        try {
            const data = await WalletService.fetchWallets(userId);
            set({ wallets: data });
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
            throw error;
        } finally {
            set({ isLoadingWallets: false });
        }
    },

    addWallet: async (userId: string, walletData: Omit<Wallet, 'id' | 'user_id'>) => {
        set({ isLoadingWallets: true });
        try {
            const newWallet = await WalletService.addWallet({
                ...walletData,
                user_id: userId
            });
            // Optimistic update
            set((state) => ({ wallets: [...state.wallets, newWallet] }));
        } catch (error) {
            console.error('Failed to add wallet:', error);
            throw error;
        } finally {
            set({ isLoadingWallets: false });
        }
    },

    syncWalletBalance: async (userId: string, walletId: string) => {
        // We do not set global loading true here so it can run silently behind the scenes
        try {
            const newBalance = await WalletService.syncWalletBalance(walletId, userId);
            set((state) => ({
                wallets: state.wallets.map(w =>
                    w.id === walletId ? { ...w, balance: newBalance } : w
                )
            }));
        } catch (error) {
            console.error(`Failed to sync balance for wallet ${walletId}:`, error);
        }
    }
});
