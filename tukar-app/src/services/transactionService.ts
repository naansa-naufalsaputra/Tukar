import { supabase } from '@/lib/supabase';
import { AddTransactionPayload, Transaction } from '@/types';

// Interface defining the response for paginated transactions
export interface PaginatedTransactions {
    data: Transaction[];
    totalCount: number;
}

export const TransactionService = {
    /**
     * Fetch paginated and optionally filtered transactions.
     * Uses offset-based pagination via Range.
     */
    async fetchTransactions(userId: string, page: number, limit: number = 20, month?: string, year?: string): Promise<PaginatedTransactions> {
        const offset = (page - 1) * limit;

        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' }) // Exact count is needed for totalPages calculation
            .eq('user_id', userId);

        if (month && year) {
            // Construct date range
            // Ensure month is 0-indexed for Date constructor
            const monthIndex = parseInt(month, 10) - 1;
            const yearNum = parseInt(year, 10);

            // First day of the month
            const startDate = new Date(yearNum, monthIndex, 1).toISOString();

            // Last day of the month
            // To get last day, we go to next month, day 0
            const endDate = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59, 999).toISOString();

            query = query
                .gte('date', startDate)
                .lte('date', endDate);
        }

        const { data, count, error } = await query
            .order('date', { ascending: false })
            .order('created_at', { ascending: false }) // Secondary sort to ensure deterministic pagination
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Fetch transaction error', error);
            throw error;
        }

        return {
            data: data as Transaction[],
            totalCount: count || 0,
        };
    },

    /**
     * Create a new transaction in Supabase
     */
    async addTransaction(userId: string, payload: AddTransactionPayload): Promise<Transaction> {
        const insertPayload = {
            ...payload,
            user_id: userId,
            // Ensure compatibility (transaction_type vs type might be differently designed, 
            // relying on what's defined in types.ts)
            type: payload.transaction_type.toLowerCase(),
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;
        return data as Transaction;
    },

    /**
     * Delete a specific transaction
     */
    async deleteTransaction(transactionId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Update an existing transaction
     */
    async updateTransaction(
        transactionId: string,
        userId: string,
        payload: Partial<AddTransactionPayload>
    ): Promise<Transaction> {
        // Prepare update object. Ensure we don't accidentally update unallowed columns.
        const updateObj: any = { ...payload };
        if (payload.transaction_type) {
            updateObj.type = payload.transaction_type.toLowerCase();
        }

        const { data, error } = await supabase
            .from('transactions')
            .update(updateObj)
            .eq('id', transactionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Transaction;
    }
};
