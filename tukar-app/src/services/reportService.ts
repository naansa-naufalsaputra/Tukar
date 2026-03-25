import { supabase } from '@/lib/supabase';

export interface CategoryBreakdown {
    categoryName: string;
    totalAmount: number;
    type: string;
}

export interface ReportSummary {
    totalIncome: number;
    totalExpense: number;
    categoryBreakdown: CategoryBreakdown[];
}

export const ReportService = {
    async generateMonthlyReport(userId: string, month: string, year: string): Promise<ReportSummary> {
        // Build start and end dates
        const monthIndex = parseInt(month, 10) - 1;
        const yearNum = parseInt(year, 10);

        const startDate = new Date(yearNum, monthIndex, 1).toISOString();
        const endDate = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59, 999).toISOString();

        const { data, error } = await supabase.rpc('get_monthly_summary', {
            p_user_id: userId,
            p_start_date: startDate,
            p_end_date: endDate
        });

        if (error) {
            console.error('Failed to generate monthly report:', error);
            throw error;
        }

        // Output from RPC
        return {
            totalIncome: data?.totalIncome || 0,
            totalExpense: data?.totalExpense || 0,
            categoryBreakdown: data?.categoryBreakdown || []
        };
    }
};
