import { supabase } from '@/lib/supabase';
import { Transaction, Category } from '@/types';

export interface AiContextData {
    month: string;
    year: string;
    currentMonthTransactions: Pick<Transaction, 'date' | 'title' | 'amount' | 'type' | 'category'>[];
    currentBudgetLimits: { category: string; limit: number; spent: number }[];
    summary: { totalIncome: number; totalExpense: number };
}

export const ChatServiceV2 = {
    async fetchAiContext(userId: string, month: string, year: string): Promise<AiContextData> {
        // Build start and end dates
        const monthIndex = parseInt(month, 10) - 1;
        const yearNum = parseInt(year, 10);

        const startDate = new Date(yearNum, monthIndex, 1).toISOString();
        const endDate = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59, 999).toISOString();

        // Fetch transactions for the month
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('date, title, amount, type, category, category_id')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false })
            .limit(50); // limit for AI context size

        if (txError) throw txError;

        // Fetch categories to get budget limits
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        if (catError) throw catError;

        const transactions = txData || [];
        const categories = (catData || []) as Category[];

        // Calculate summary and spent by category
        let totalIncome = 0;
        let totalExpense = 0;
        const spentByCategory: Record<string, number> = {};

        transactions.forEach(tx => {
            const amount = Number(tx.amount || 0);
            if (tx.type?.toLowerCase() === 'income') {
                totalIncome += amount;
            } else if (tx.type?.toLowerCase() === 'expense') {
                totalExpense += amount;

                const catId = tx.category_id || categories.find(c => c.name === tx.category)?.id;
                if (catId) {
                    spentByCategory[catId] = (spentByCategory[catId] || 0) + amount;
                }
            }
        });

        // Map budget limits
        const currentBudgetLimits = categories
            .filter(cat => cat.budget_limit && cat.budget_limit > 0)
            .map(cat => ({
                category: cat.name,
                limit: cat.budget_limit || 0,
                spent: spentByCategory[cat.id] || 0
            }));

        return {
            month,
            year,
            currentMonthTransactions: transactions.map(t => ({
                date: t.date,
                title: t.title,
                amount: t.amount,
                type: t.type,
                category: t.category
            })),
            currentBudgetLimits,
            summary: { totalIncome, totalExpense }
        };
    }
};
