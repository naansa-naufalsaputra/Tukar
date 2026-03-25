import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, SectionList, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SkeletonLoader } from '../components/animations/SkeletonLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { format, parseISO, isSameMonth } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { ArrowDown, ArrowUp, Download } from 'lucide-react-native';

import { PieChart } from 'react-native-gifted-charts';
import { TransactionItem } from '../components/TransactionItem';
import { MonthSelector } from '../components/MonthSelector';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateMonthlyReportHTML } from '../lib/report';
import { Logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { AnimatedPressable } from '../components/animations/AnimatedPressable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BudgetProgressCard } from '../components/ui/BudgetProgressCard';
import { getWalletTheme, cosmicChartTheme, cosmicPieColors } from '../utils/themeUtils';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedEmptyState } from '../components/animations/AnimatedEmptyState';
import { RootStackParamList, Transaction } from '../types';

const THEME_COLORS = {
    light: {
        background: '#ffffff',
        chart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#06b6d4', '#f97316'],
    },
    dark: {
        background: '#1e1e2e',
        chart: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#38bdf8', '#f472b6', '#22d3ee', '#fb923c'],
    },
};

import { Typography } from '@/components/Typography';

export default function ActivityScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'> }) {
    const {
        transactions,
        categories,
        deleteTransaction,
        currentTheme,
        selectedMonth,
        loadMoreTransactions,
        hasMoreTransactions,
        isLoadingMore
    } = useStoreV2();
    const isDark = currentTheme === 'dark';
    const [userId, setUserId] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const { t } = useTranslation();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    // 🧠 0. FILTER TRANSACTIONS BY SELECTED MONTH
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(t => {
            const date = t.date ? parseISO(t.date) : (t.created_at ? parseISO(t.created_at) : new Date());
            return isSameMonth(date, selectedMonth);
        });
    }, [transactions, selectedMonth]);

    // 🧠 1. LOGIKA KALKULASI TOTAL (Pemasukan & Pengeluaran)
    const totals = useMemo(() => {
        if (!filteredTransactions) return { income: 0, expense: 0 };
        return filteredTransactions.reduce((acc, curr) => {
            const type = (curr.transaction_type || curr.type || '').toUpperCase();
            if (type === 'INCOME') acc.income += curr.amount;
            if (type === 'EXPENSE') acc.expense += curr.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    // 🧠 2. LOGIKA PIE CHART (Mengelompokkan Pengeluaran/Pemasukan per Kategori)
    const pieData = useMemo(() => {
        if (!filteredTransactions || !categories) return [];

        const filteredTx = filteredTransactions.filter(t => {
            const type = (t.transaction_type || t.type || '').toUpperCase();
            return type === chartType;
        });

        const groupedByCategory = filteredTx.reduce<Record<string, number>>((acc, curr) => {
            if (!curr.category_id) return acc;
            acc[curr.category_id] = (acc[curr.category_id] || 0) + curr.amount;
            return acc;
        }, {});

        return Object.keys(groupedByCategory).map((catId, index) => {
            const category = categories.find(c => c.id === catId);
            const value = groupedByCategory[catId];
            const totalForChart = chartType === 'EXPENSE' ? totals.expense : totals.income;
            const percentageValue = totalForChart > 0 ? (value / totalForChart) * 100 : 0;
            const budgetLimit = category?.budget_limit || 0;
            return {
                value,
                color: cosmicPieColors[index % cosmicPieColors.length],
                text: `${percentageValue.toFixed(0)}%`,
                textColor: '#ffffff',
                fontWeight: 'bold',
                categoryName: category?.name || t('other'),
                icon_name: category?.icon_name,
                budgetLimit,
                budgetUsedPct: budgetLimit > 0 ? Math.min((value / budgetLimit) * 100, 100) : 0,
            };
        }).sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categories, totals, chartType]);

    // 🧠 3. LOGIKA GROUPING RIWAYAT (Berdasarkan Tanggal)
    const groupedTransactions = useMemo(() => {
        if (!filteredTransactions) return [];
        const grouped = filteredTransactions.reduce<Record<string, { title: string; data: Transaction[] }>>((acc, curr) => {
            const dateStr = curr.created_at ? parseISO(curr.created_at) : new Date();
            const dateKey = format(dateStr, 'dd MMMM yyyy', { locale: localeID });
            if (!acc[dateKey]) acc[dateKey] = { title: dateKey, data: [] };
            acc[dateKey].data.push(curr);
            return acc;
        }, {});
        return Object.values(grouped);
    }, [filteredTransactions]);

    const handleLongPress = (item: Transaction) => {
        Alert.alert(
            t('transactionOptions'),
            `${t('chooseActionFor')}:\n"${item.title || item.notes}" (Rp ${item.amount.toLocaleString('id-ID')})`,
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('edit'),
                    onPress: () => navigation.navigate('AddTransactionScreen', { editData: item })
                },
                {
                    text: t('delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (!userId) {
                                Alert.alert(t('error'), t('invalidUserSession'));
                                return;
                            }
                            await deleteTransaction(item.id, userId);
                            Alert.alert(t('success'), t('transactionDeleted'));
                        } catch (e) {
                            Alert.alert(t('failed'), t('cannotDeleteTransaction'));
                        }
                    }
                }
            ]
        );
    };

    const handleLoadMore = () => {
        if (userId && hasMoreTransactions && !isLoadingMore) {
            loadMoreTransactions(userId);
        }
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View className="py-6 items-center">
                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
            </View>
        );
    };

    const formatDinamis = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + t('million');
        return num.toLocaleString('id-ID');
    };

    const handleExportReport = async () => {
        if (!filteredTransactions || filteredTransactions.length === 0) {
            Alert.alert(t('emptyData'), t('noTransactionsThisMonth'));
            return;
        }

        try {
            const html = generateMonthlyReportHTML(selectedMonth, filteredTransactions, categories);
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert(t('exportFailed'), t('exportError'));
            Logger.error('ActivityScreen:exportReport', error);
        }
    };

    const ListHeader = () => (
        <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
                <Typography variant="h1" weight="bold">{t('activity')}</Typography>
                <AnimatedPressable
                    onPress={handleExportReport}
                    className="p-3 rounded-2xl bg-card border border-border"
                    scaleTo={0.9}
                >
                    <Download size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </AnimatedPressable>
            </View>

            <MonthSelector />
        </View>
    );

    const ActivitySkeleton = () => (
        <View className="px-5 pt-4">
            <View className="flex-row justify-between items-center mb-6">
                <SkeletonLoader width={150} height={32} />
                <SkeletonLoader width={44} height={44} borderRadius={16} />
            </View>
            <SkeletonLoader width="100%" height={50} borderRadius={16} className="mb-6" />
            <View className="flex-row gap-4 mb-8">
                <SkeletonLoader width="48%" height={100} borderRadius={24} />
                <SkeletonLoader width="48%" height={100} borderRadius={24} />
            </View>
            <SkeletonLoader width={150} height={24} className="mb-4" />
            <SkeletonLoader width="100%" height={250} borderRadius={32} className="mb-8" />
            <SkeletonLoader width={180} height={24} className="mb-4" />
            {[1, 2, 3].map((i) => (
                <SkeletonLoader key={i} width="100%" height={80} borderRadius={24} className="mb-3" />
            ))}
        </View>
    );
        <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
                <Typography variant="h1" weight="bold">{t('activity')}</Typography>
                <AnimatedPressable
                    onPress={handleExportReport}
                    className="p-3 rounded-2xl bg-card border border-border"
                    scaleTo={0.9}
                >
                    <Download size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </AnimatedPressable>
            </View>

            <MonthSelector />

            <View className="flex-row gap-4 mb-8 mt-4">
                <View className="flex-1 p-5 rounded-3xl bg-card border border-border shadow-sm">
                    <View className="flex-row items-center gap-2 mb-3">
                        <View className="w-8 h-8 rounded-full bg-emerald-500/10 items-center justify-center">
                            <ArrowDown size={18} color="#10b981" />
                        </View>
                        <Typography variant="caption" weight="medium" className="text-muted-foreground">{t('income')}</Typography>
                    </View>
                    <Typography variant="h3" weight="bold">Rp {formatDinamis(totals.income)}</Typography>
                </View>

                <View className="flex-1 p-5 rounded-3xl bg-card border border-border shadow-sm">
                    <View className="flex-row items-center gap-2 mb-3">
                        <View className="w-8 h-8 rounded-full bg-rose-500/10 items-center justify-center">
                            <ArrowUp size={18} color="#f43f5e" />
                        </View>
                        <Typography variant="caption" weight="medium" className="text-muted-foreground">{t('expense')}</Typography>
                    </View>
                    <Typography variant="h3" weight="bold" className="text-rose-500">Rp {formatDinamis(totals.expense)}</Typography>
                </View>
            </View>

            <Typography variant="body1" weight="bold" className="mb-4">{t('monthlyAnalysis')}</Typography>

            <View className="flex-row bg-muted/30 p-1.5 rounded-2xl mb-8">
                <AnimatedPressable
                    onPress={() => setChartType('EXPENSE')}
                    className={`flex-1 py-3 rounded-xl items-center ${chartType === 'EXPENSE' ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-transparent'}`}
                    scaleTo={0.95}
                >
                    <Typography weight="bold" variant="body2" className={chartType === 'EXPENSE' ? 'text-white' : 'text-muted-foreground'}>
                        {t('expense')}
                    </Typography>
                </AnimatedPressable>

                <AnimatedPressable
                    onPress={() => setChartType('INCOME')}
                    className={`flex-1 py-3 rounded-xl items-center ${chartType === 'INCOME' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-transparent'}`}
                    scaleTo={0.95}
                >
                    <Typography weight="bold" variant="body2" className={chartType === 'INCOME' ? 'text-white' : 'text-muted-foreground'}>
                        {t('income')}
                    </Typography>
                </AnimatedPressable>
            </View>

            {pieData.length > 0 ? (
                <View className="items-center mb-8">
                    <PieChart
                        donut={true}
                        data={pieData}
                        radius={110}
                        innerRadius={75}
                        innerCircleColor={isDark ? '#0f172a' : '#ffffff'}
                        showText
                        textSize={12}
                        textColor="#ffffff"
                        centerLabelComponent={() => (
                            <View className="items-center justify-center">
                                <Typography variant="caption" weight="medium" className="text-muted-foreground mb-1">
                                    {chartType === 'EXPENSE' ? t('expense') : t('income')}
                                </Typography>
                                <Typography variant="h3" weight="bold" className={chartType === 'EXPENSE' ? 'text-rose-500' : 'text-emerald-500'}>
                                    {formatDinamis(chartType === 'EXPENSE' ? totals.expense : totals.income)}
                                </Typography>
                            </View>
                        )}
                    />

                    <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-2 px-6 mt-8">
                        {pieData.map((item, index) => (
                            <View key={index} className="flex-row items-center gap-2">
                                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <Typography variant="caption" className="text-muted-foreground">{item.categoryName}</Typography>
                            </View>
                        ))}
                    </View>

                    <View className="w-full mt-10 gap-y-4">
                        {pieData.map((item, index) => (
                            <BudgetProgressCard
                                key={index}
                                categoryName={item.categoryName}
                                iconName={item.icon_name || 'CircleDashed'}
                                colorHex={item.color}
                                spentAmount={item.value}
                                budgetLimit={item.budgetLimit}
                            />
                        ))}
                    </View>
                </View>
            ) : (
                <View className="items-center justify-center h-56 bg-card rounded-3xl mb-8 border border-border shadow-sm overflow-hidden">
                    <AnimatedEmptyState message={t('noExpenseDataThisMonth')} icon="inbox" />
                </View>
            )}

            <Typography variant="body1" weight="bold" className="mt-4 mb-2">{t('transactionHistory')}</Typography>
        </View>
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <SectionList
                sections={groupedTransactions as { title: string; data: Transaction[] }[]}
                keyExtractor={(item: Transaction) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                renderSectionHeader={({ section: { title } }) => (
                    <Typography variant="caption" weight="bold" className="text-muted-foreground uppercase tracking-widest mb-3 mt-6 bg-background">
                        {title}
                    </Typography>
                )}
                renderItem={({ item, index }: { item: Transaction; index: number }) => (
                    <Animated.View
                        className="bg-card rounded-3xl p-4 mb-3 border border-border shadow-sm"
                        entering={FadeInDown.duration(400).delay(Math.min(index, 8) * 100)}
                    >
                        <AnimatedPressable onLongPress={() => handleLongPress(item)}>
                            <TransactionItem transaction={item} index={index} />
                        </AnimatedPressable>
                    </Animated.View>
                )}
            />
        </SafeAreaView>
    );
}
