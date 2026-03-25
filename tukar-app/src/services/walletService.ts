import { supabase } from '@/lib/supabase';
import { Wallet } from '@/types';

export const WalletService = {
    /**
     * Fetch all wallets for a specific user.
     */
    async fetchWallets(userId: string): Promise<Wallet[]> {
        const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Wallet[];
    },

    /**
     * Calculate and update wallet balance based on sum of transactions.
     * This follows the explicit balance recalculation logic.
     */
    async syncWalletBalance(walletId: string, userId: string): Promise<number> {
        // Since Supabase RPC (Stored Procedure) is the best way to do this transactionally,
        // we'll fetch all transactions and calculate on the client as a fallback if you don't have RPC setup.
        // For production, it is highly recommended to create a PostgreSQL trigger or RPC.

        const { data, error } = await supabase
            .from('transactions')
            .select('amount, type, transaction_type')
            .eq('wallet_id', walletId)
            .eq('user_id', userId);

        if (error) throw error;

        let totalChange = 0;
        data.forEach(tx => {
            // Using transaction_type or type depending on your DB normalisation
            const tType = tx.transaction_type?.toLowerCase() || tx.type;
            if (tType === 'income') {
                totalChange += tx.amount;
            } else if (tType === 'expense') {
                totalChange -= tx.amount;
            } else if (tType === 'transfer') {
                // Determine if this is source or dest - requires source/dest mapping in DB
                // Assuming standard transfer takes FROM the wallet.
                totalChange -= tx.amount;
            }
        });

        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: totalChange })
            .eq('id', walletId)
            .eq('user_id', userId);

        if (updateError) throw updateError;

        return totalChange;
    },

    /**
     * Create a new wallet
     */
    async addWallet(walletData: Omit<Wallet, 'id'>): Promise<Wallet> {
        const { data, error } = await supabase
            .from('wallets')
            .insert([walletData])
            .select()
            .single();

        if (error) throw error;
        return data as Wallet;
    }
};
