import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal, TrendingUp, FileText, X, Download } from 'lucide-react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useNavigation } from '@react-navigation/native';
import { ModernBudgetProgressCard } from '../components/ui/ModernBudgetProgressCard';

import { useStoreV2 } from '../store/v2/useStoreV2';
import { isSameMonth, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ReportExportService } from '../services/reportExportService';

export function AnalyticsScreen() {
    const navigation = useNavigation();
    const [userId, setUserId] = useState<string>('');
    const [isExporting, setIsExporting] = useState<boolean>(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    // Subscribe to state
    const transactions = useStoreV2(state => state.transactions);
    const categories = useStoreV2(state => state.categories);
    const { reportData, isLoadingReport, generateMonthlyReport, clearReport } = useStoreV2();

    // Calculate actual budget data
    const { budgetData, totalSpentThisMonth, pieChartData } = React.useMemo(() => {
        const today = new Date();

        // Filter out only this month's expenses
        const currentMonthExpenses = transactions.filter(tx =>
            (tx.transaction_type === 'EXPENSE' || tx.type === 'expense') &&
            isSameMonth(tx.created_at ? parseISO(tx.created_at) : today, today)
        );

        // Group expenses by category
        const spentByCategory: Record<string, number> = {};
        let totalSpent = 0;

        currentMonthExpenses.forEach(tx => {
            totalSpent += Number(tx.amount || 0);
            const catId = tx.category_id || (categories.find(c => c.name === tx.category)?.id);
            if (catId) {
                spentByCategory[catId] = (spentByCategory[catId] || 0) + Number(tx.amount || 0);
            }
        });

        // Map categories that have a budget limit
        const mappedData = categories
            .filter(cat => cat.budget_limit && cat.budget_limit > 0)
            .map(cat => ({
                category: cat.name,
                spent: spentByCategory[cat.id] || 0,
                budgeted: cat.budget_limit || 0,
                colorHex: cat.color_hex || '#3b82f6',
            }));

        // Generate data for PieChart
        const pieData = mappedData
            .filter(item => item.spent > 0)
            .map(item => ({
                value: item.spent,
                color: item.colorHex,
            }));

        return { budgetData: mappedData, totalSpentThisMonth: totalSpent, pieChartData: pieData };
    }, [transactions, categories]);

    // Format currency (IDR)
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleGenerateReport = async () => {
        if (!userId) return;
        const currentMonth = (new Date().getMonth() + 1).toString();
        const currentYear = new Date().getFullYear().toString();
        await generateMonthlyReport(userId, currentMonth, currentYear);
    };

    const handleExportPdf = async () => {
        if (!reportData) return;
        setIsExporting(true);
        const currentMonth = (new Date().getMonth() + 1).toString();
        const currentYear = new Date().getFullYear().toString();
        const success = await ReportExportService.exportReportAsPdf(reportData, currentMonth, currentYear);
        setIsExporting(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111827]" edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Dynamic Background Effects */}
            <View className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
                <View className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2" />
                <View className="absolute bottom-0 -left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/3" />
            </View>

            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between z-10">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md border border-white/10"
                >
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold tracking-wider">Analytics</Text>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md border border-white/10"
                >
                    <MoreHorizontal size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-5 z-10"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
            >
                {/* Summary / Chart Placeholder Area (Glassmorphism) */}
                <View className="w-full bg-white/10 rounded-3xl p-6 border border-white/20 backdrop-blur-xl shadow-xl mb-8">
                    <View className="flex-row items-center gap-3 mb-6">
                        <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                            <TrendingUp size={20} color="#34d399" />
                        </View>
                        <View>
                            <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Spent This Month</Text>
                            <Text className="text-white text-3xl font-bold mt-1">{formatCurrency(totalSpentThisMonth)}</Text>
                        </View>
                    </View>

                    {/* Actual Pie Chart */}
                    <View className="items-center justify-center mt-2">
                        {pieChartData.length > 0 ? (
                            <View className="relative items-center justify-center">
                                <PieChart
                                    data={pieChartData}
                                    donut
                                    radius={85}
                                    innerRadius={55}
                                    backgroundColor="transparent"
                                />
                                <View className="absolute items-center justify-center">
                                    <Text className="text-white/50 text-xs text-center">Pengeluaran</Text>
                                    <Text className="text-white font-bold text-center">Bulan Ini</Text>
                                </View>
                            </View>
                        ) : (
                            <View className="h-40 w-full bg-white/5 rounded-2xl items-center justify-center border border-white/5">
                                <Text className="text-white/40 text-xs mt-2">Belum ada pengeluaran</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Section Title */}
                <Text className="text-white text-lg font-bold mb-4 ml-2">Budget Progress</Text>

                {/* Budget Progress Cards */}
                <View className="gap-y-4">
                    {budgetData.length > 0 ? (
                        budgetData.map((data, index) => (
                            <ModernBudgetProgressCard
                                key={index}
                                data={data}
                                colorHex={data.colorHex}
                            />
                        ))
                    ) : (
                        <View className="bg-white/5 border border-white/10 rounded-3xl p-6 items-center flex-1">
                            <Text className="text-white/50 text-center">Belum ada anggaran yang diatur. Silakan atur anggaran kategori terlebih dahulu.</Text>
                        </View>
                    )}
                </View>

                {/* Report Generation Button */}
                <TouchableOpacity
                    onPress={handleGenerateReport}
                    disabled={isLoadingReport}
                    className="mt-8 mb-4 w-full bg-primary/20 border border-primary/40 rounded-2xl p-4 flex-row items-center justify-center gap-3 backdrop-blur-md"
                >
                    {isLoadingReport ? <ActivityIndicator color="#3b82f6" /> : <FileText color="#3b82f6" size={20} />}
                    <Text className="text-primary font-bold text-lg">{isLoadingReport ? 'Generating Report...' : 'Generate Monthly Report'}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Report Summary Modal */}
            <Modal visible={!!reportData && !isLoadingReport} animationType="slide" transparent={true} onRequestClose={clearReport}>
                <View className="flex-1 justify-end">
                    {/* Backdrop */}
                    <TouchableOpacity className="absolute top-0 left-0 right-0 bottom-0 bg-black/60" activeOpacity={1} onPress={clearReport} />

                    {/* Modal Content */}
                    <View className="bg-[#1e293b]/95 rounded-t-[32px] border-t border-white/10 overflow-hidden backdrop-blur-3xl pb-10 h-[80%]">
                        <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
                            <Text className="text-white text-lg font-bold">Monthly Report Summary</Text>
                            <TouchableOpacity onPress={clearReport} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {reportData && (
                            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                                <View className="flex-row justify-between mb-6">
                                    <View className="flex-1 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl mr-2">
                                        <Text className="text-white/60 text-xs">Total Income</Text>
                                        <Text className="text-white font-bold text-lg">{formatCurrency(reportData.totalIncome)}</Text>
                                    </View>
                                    <View className="flex-1 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl ml-2">
                                        <Text className="text-white/60 text-xs">Total Expense</Text>
                                        <Text className="text-white font-bold text-lg">{formatCurrency(reportData.totalExpense)}</Text>
                                    </View>
                                </View>
                                <Text className="text-white text-md font-bold mb-4">Category Breakdown</Text>
                                {reportData.categoryBreakdown && reportData.categoryBreakdown.map((item, index) => (
                                    <View key={index} className="flex-row justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl mb-3">
                                        <View className="flex-row items-center gap-3">
                                            <View className={`w-3 h-3 rounded-full ${item.type.toLowerCase() === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                                            <Text className="text-white font-semibold">{item.categoryName || 'Uncategorized'}</Text>
                                        </View>
                                        <Text className="text-white/80 font-bold">{formatCurrency(item.totalAmount)}</Text>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    onPress={handleExportPdf}
                                    disabled={isExporting}
                                    className="mt-6 w-full bg-primary/80 rounded-full p-4 flex-row items-center justify-center gap-2"
                                >
                                    {isExporting ? <ActivityIndicator color="#fff" /> : <Download size={20} color="#fff" />}
                                    <Text className="text-white font-bold text-lg">{isExporting ? 'Generating PDF...' : 'Download PDF'}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
