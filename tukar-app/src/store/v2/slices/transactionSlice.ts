import { StateCreator } from 'zustand';
import { Transaction, AddTransactionPayload } from '@/types';
import { TransactionService } from '@/services/transactionService';

// V2 Paginated Store Structure
export interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
}

export interface TransactionSlice {
    transactions: Transaction[];
    isLoadingTransactions: boolean;
    transactionPagination: PaginationState;
    currentMonthFilter: string | null;
    currentYearFilter: string | null;
    // Actions
    fetchTransactions: (userId: string, page: number, limit?: number) => Promise<void>;
    addTransaction: (userId: string, payload: AddTransactionPayload) => Promise<void>;
    deleteTransaction: (userId: string, transactionId: string, walletId: string) => Promise<void>;
    setTransactionFilter: (userId: string, month: string | null, year: string | null) => void;
}

export const createTransactionSlice: StateCreator<
    TransactionSlice & any, // Composed with WalletSlice to call syncWalletBalance
    [['zustand/persist', unknown]],
    [],
    TransactionSlice
> = (set, get) => ({
    transactions: [],
    isLoadingTransactions: false,
    currentMonthFilter: null,
    currentYearFilter: null,
    transactionPagination: {
        currentPage: 1,
        itemsPerPage: 15, // Opting for 15 per page for typical mobile screen heights
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
    },

    fetchTransactions: async (userId: string, page: number, limit: number = 15) => {
        set({ isLoadingTransactions: true });
        try {
            const { currentMonthFilter, currentYearFilter } = get();

            const monthStr = currentMonthFilter || undefined;
            const yearStr = currentYearFilter || undefined;

            const { data, totalCount } = await TransactionService.fetchTransactions(userId, page, limit, monthStr, yearStr);

            set((state: TransactionSlice) => {
                const totalPages = Math.ceil(totalCount / limit);
                // If page 1, overwrite. Otherwise, append (for infinite scroll)
                let newTransactions = page === 1
                    ? data
                    : [...state.transactions, ...data];

                // Remove exact duplicates just in case (e.g. if new item added while scrolling)
                const uniqueIds = new Set();
                newTransactions = newTransactions.filter((t: Transaction) => {
                    if (uniqueIds.has(t.id)) return false;
                    uniqueIds.add(t.id);
                    return true;
                });

                return {
                    transactions: newTransactions,
                    transactionPagination: {
                        currentPage: page,
                        itemsPerPage: limit,
                        totalItems: totalCount,
                        totalPages,
                        hasMore: page < totalPages,
                    }
                };
            });
        } catch (error) {
            console.error('Failed to fetch v2 transactions:', error);
            throw error; // Let UI handle if needed
        } finally {
            set({ isLoadingTransactions: false });
        }
    },

    setTransactionFilter: (userId: string, month: string | null, year: string | null) => {
        set({
            currentMonthFilter: month,
            currentYearFilter: year,
            transactions: [], // clear list for new fetch
            transactionPagination: {
                ...get().transactionPagination,
                currentPage: 1, // Reset pagination
                hasMore: false,
                totalItems: 0,
                totalPages: 0,
            }
        });
        get().fetchTransactions(userId, 1);
    },

    addTransaction: async (userId: string, payload: AddTransactionPayload) => {
        set({ isLoadingTransactions: true });
        try {
            // Wait for DB insertion
            const newTx = await TransactionService.addTransaction(userId, payload);

            // 🛑 CRITICAL INTEGRATION: Sync Wallet Balance silently after insertion!
            if (get().syncWalletBalance) {
                get().syncWalletBalance(userId, payload.wallet_id);
            }

            // Optimistic update to list 
            set((state: TransactionSlice) => ({
                transactions: [newTx, ...state.transactions],
                transactionPagination: {
                    ...state.transactionPagination,
                    totalItems: state.transactionPagination.totalItems + 1,
                }
            }));

        } catch (error) {
            console.error('Failed to add v2 transaction:', error);
            throw error;
        } finally {
            set({ isLoadingTransactions: false });
        }
    },

    deleteTransaction: async (userId: string, transactionId: string, walletId: string) => {
        set({ isLoadingTransactions: true });
        try {
            // Supabase delete
            await TransactionService.deleteTransaction(transactionId, userId);

            // 🛑 CRITICAL INTEGRATION: Adjust wallet balance back due to deleted tx!
            if (get().syncWalletBalance && walletId) {
                get().syncWalletBalance(userId, walletId);
            }

            set((state: TransactionSlice) => ({
                transactions: state.transactions.filter((t: Transaction) => t.id !== transactionId),
                transactionPagination: {
                    ...state.transactionPagination,
                    totalItems: Math.max(0, state.transactionPagination.totalItems - 1),
                }
            }));
        } catch (error) {
            console.error('Failed to delete v2 transaction:', error);
            throw error;
        } finally {
            set({ isLoadingTransactions: false });
        }
    }
});
