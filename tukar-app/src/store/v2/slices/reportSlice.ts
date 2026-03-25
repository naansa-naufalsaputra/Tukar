import { StateCreator } from 'zustand';
import { ReportService, ReportSummary, CategoryBreakdown } from '@/services/reportService';

export interface ReportSlice {
    reportData: ReportSummary | null;
    isLoadingReport: boolean;
    generateMonthlyReport: (userId: string, reportMonth: string, reportYear: string) => Promise<void>;
    clearReport: () => void;
}

export const createReportSlice: StateCreator<
    ReportSlice,
    [['zustand/persist', unknown]],
    [],
    ReportSlice
> = (set) => ({
    reportData: null,
    isLoadingReport: false,

    generateMonthlyReport: async (userId: string, reportMonth: string, reportYear: string) => {
        set({ isLoadingReport: true });
        try {
            const result = await ReportService.generateMonthlyReport(userId, reportMonth, reportYear);
            set({ reportData: result });
        } catch (error) {
            console.error('Failure in generateMonthlyReport action', error);
        } finally {
            set({ isLoadingReport: false });
        }
    },

    clearReport: () => {
        set({ reportData: null });
    }
});
