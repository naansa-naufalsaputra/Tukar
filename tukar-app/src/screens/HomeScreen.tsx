import React, { useState, useEffect } from 'react';

import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Text, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Sparkles, ArrowRight, Receipt, AlertTriangle, Eye, EyeOff, Wallet as WalletIcon } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { Typography } from '../components/Typography';
import { TransactionItem } from '../components/TransactionItem';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWalletTheme } from '../utils/themeUtils';
import { AddWalletModal } from '../components/AddWalletModal';
import { supabase } from '../lib/supabase';
import { isSameMonth, parseISO, format } from 'date-fns';

import { id as localeID } from 'date-fns/locale';
import { AnimatedPressable } from '../components/animations/AnimatedPressable';
import { SkeletonLoader } from '../components/animations/SkeletonLoader';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Transaction } from '../types';

type HomeScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
    const { t } = useTranslation();
    const { wallets, transactions, currentTheme, parseAIInput, isParsingAI, isLoading, deleteTransaction, selectedMonth, categories, isHideBalance, toggleHideBalance } = useStore();
    const [inputText, setInputText] = useState('');
    const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const isDark = currentTheme === 'dark';

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

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


    const SkeletonWallet = () => (
        <View className="flex-1 rounded-3xl p-4 bg-card border border-border h-32 justify-between overflow-hidden shadow-sm">
            <View className="flex-row items-center gap-2">
                <SkeletonLoader width={28} height={28} borderRadius={14} />
                <SkeletonLoader width={80} height={16} />
            </View>
            <SkeletonLoader width={120} height={24} className="mt-auto" />
        </View>
    );

    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const formattedTotal = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(totalBalance);

    // 🧠 Kalkulasi Otomatis: Cek berapa kategori yang budget-nya kritis (>80%)
    const overBudgetCount = React.useMemo(() => {
        if (!transactions || !categories) return 0;

        const today = new Date();
        // 1. Ambil pengeluaran bulan ini saja
        const currentMonthExpenses = transactions.filter(tx =>
            (tx.transaction_type === 'EXPENSE' || tx.type === 'expense') && isSameMonth(tx.created_at ? parseISO(tx.created_at) : new Date(), today)
        );

        // 2. Kelompokkan total pengeluaran per kategori
        const spentByCategory: Record<string, number> = {};
        currentMonthExpenses.forEach(tx => {
            const catId = tx.category_id || (categories.find(c => c.name === tx.category)?.id);
            if (catId) {
                spentByCategory[catId] = (spentByCategory[catId] || 0) + tx.amount;
            }
        });

        // 3. Hitung berapa yang jebol atau kritis (>80%)
        let count = 0;
        categories.forEach(cat => {
            if (cat.budget_limit && cat.budget_limit > 0) {
                const spent = spentByCategory[cat.id] || 0;
                const percentage = (spent / cat.budget_limit) * 100;
                if (percentage >= 80) count++;
            }
        });

        return count;
    }, [transactions, categories]);

    const handleParse = async () => {
        if (!inputText.trim() || isParsingAI) return;
        const result = await parseAIInput(inputText);
        if (result) {
            navigation.navigate('AddTransactionScreen', { editData: result });
            Toast.show({ type: 'success', text1: t('transactionDetected'), text2: t('pleaseCheckDetails') });
            setInputText('');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View entering={FadeInUp.duration(600)} className="flex-row items-center justify-between mb-4">
                    <Typography variant="h3" weight="bold">Tukar</Typography>
                    <AnimatedPressable className="p-2 rounded-full bg-card border border-border" scaleTo={0.9}>
                        <Bell size={22} color={isDark ? '#F1F5F9' : '#1E293B'} />
                    </AnimatedPressable>
                </Animated.View>

                {/* Total Balance */}
                <Animated.View entering={FadeInDown.delay(100).duration(800)} className="items-center mb-8">
                    <Typography variant="body2" color="muted" className="mb-1 uppercase tracking-widest font-semibold">{t('totalBalance')}</Typography>
                    <View className="flex-row items-center justify-center">
                        <Typography variant="h1" weight="bold" className="text-foreground">{isHideBalance ? 'Rp ********' : formattedTotal}</Typography>
                        <AnimatedPressable onPress={toggleHideBalance} scaleTo={0.8} className="p-2 ml-1 opacity-50">
                            {isHideBalance ? <EyeOff size={20} color={isDark ? '#F1F5F9' : '#1E293B'} /> : <Eye size={20} color={isDark ? '#F1F5F9' : '#1E293B'} />}
                        </AnimatedPressable>
                    </View>
                </Animated.View>

                {/* Smart AI Input Bar */}
                <Animated.View
                    entering={FadeInDown.delay(200).duration(800)}
                    className="flex-row items-center bg-card border border-sky-500/30 rounded-3xl px-4 py-2 mb-10 shadow-xl shadow-sky-500/10 overflow-hidden"
                >
                    <Sparkles size={20} color="#0ea5e9" className="mr-3" />
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={t('typeExpenseAI')}
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        className="flex-1 text-base text-foreground font-sans h-12"
                        onSubmitEditing={handleParse}
                        editable={!isParsingAI}
                    />
                    <AnimatedPressable
                        onPress={handleParse}
                        disabled={isParsingAI || !inputText.trim()}
                        className="w-10 h-10 rounded-2xl bg-primary items-center justify-center ml-2"
                        scaleTo={0.9}
                    >
                        {isParsingAI ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <ArrowRight size={20} color="#FFF" />
                        )}
                    </AnimatedPressable>
                </Animated.View>

                {/* Wallets */}
                <Animated.View entering={FadeInDown.delay(300).duration(800)} className="mb-10 -mx-5">
                    {isLoading ? (
                        <View className="flex-row px-5 gap-3">
                            <SkeletonWallet />
                            <SkeletonWallet />
                        </View>
                    ) : wallets.length === 0 ? (
                        <View className="px-5">
                            <AnimatedPressable
                                className="w-full rounded-3xl p-4 bg-transparent border-2 border-dashed border-border h-32 items-center justify-center"
                                onPress={() => setAddWalletModalVisible(true)}
                            >
                                <View className="w-8 h-8 rounded-full bg-muted items-center justify-center mb-2">
                                    <Typography variant="body2" color="muted">+</Typography>
                                </View>
                                <Typography variant="caption" color="muted">{t('addWallet')}</Typography>
                            </AnimatedPressable>
                        </View>
                    ) : (
                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
                            layout={LinearTransition.springify()}
                        >
                            {wallets?.map((wallet) => {
                                const theme = getWalletTheme(wallet.name);
                                return (
                                    <Animated.View
                                        key={wallet.id}
                                        layout={LinearTransition.springify()}
                                        className={`w-[260px] h-40 p-5 rounded-3xl bg-card border ${theme.border} relative overflow-hidden shadow-sm justify-between`}
                                    >
                                        <View className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${theme.bg} opacity-20 blur-3xl`} />
                                        <View className="flex-row items-center gap-2 mb-4">
                                            <View className={`w-8 h-8 rounded-2xl items-center justify-center ${theme.bg}`}>
                                                <WalletIcon size={16} color={theme.icon} />
                                            </View>
                                            <Typography variant="body2" weight="semibold">{wallet.name}</Typography>
                                        </View>
                                        <View>
                                            <Typography variant="caption" color="muted" className="mb-1">{t('balance')}</Typography>
                                            <Typography variant="h3" weight="bold">
                                                Rp <Text className={theme.text}>
                                                    {isHideBalance ? '******' : Number(wallet.balance).toLocaleString('id-ID')}
                                                </Text>
                                            </Typography>
                                        </View>
                                    </Animated.View>
                                );
                            })}
                            <AnimatedPressable
                                className="w-[100px] h-40 rounded-3xl bg-card border-2 border-dashed border-border items-center justify-center"
                                onPress={() => setAddWalletModalVisible(true)}
                            >
                                <View className="w-8 h-8 rounded-full bg-muted items-center justify-center mb-2">
                                    <Typography variant="body1" color="muted">+</Typography>
                                </View>
                                <Typography variant="caption" color="muted" className="text-center">{t('add')}</Typography>
                            </AnimatedPressable>
                        </Animated.ScrollView>
                    )}
                </Animated.View>
                {/* Widgets (Wishlist & AI) */}
                <Animated.View entering={FadeInDown.delay(400).duration(800)} className="flex-row gap-4 mb-10">
                    <AnimatedPressable
                        className="flex-1 bg-blue-500/5 border border-blue-500/10 rounded-3xl p-5 flex-row items-center"
                        onPress={() => navigation.navigate('Wishlist')}
                        scaleTo={0.97}
                    >
                        <View className="w-10 h-10 rounded-2xl bg-blue-500/10 items-center justify-center mr-3">
                            <Typography variant="body1">🎯</Typography>
                        </View>
                        <View className="flex-1">
                            <Typography variant="body1" weight="bold" color="primary">Wishlist</Typography>
                            <Typography variant="caption" color="muted">{t('savingsTarget')}</Typography>
                        </View>
                    </AnimatedPressable>

                    <AnimatedPressable
                        className="flex-1 bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-5 flex-row items-center"
                        onPress={() => navigation.navigate('ChatScreen')}
                        scaleTo={0.97}
                    >
                        <View className="w-10 h-10 rounded-2xl bg-cyan-500/10 items-center justify-center mr-3">
                            <Typography variant="body1">🤖</Typography>
                        </View>
                        <View className="flex-1">
                            <Typography variant="body1" weight="bold" className="text-cyan-600 dark:text-cyan-400">AI Chat</Typography>
                            <Typography variant="caption" color="muted">{t('smartAssistant')}</Typography>
                        </View>
                    </AnimatedPressable>
                </Animated.View>

                {/* 🚨 WIDGET WARNING BUDGET (Hanya muncul jika ada yang kritis) */}
                {overBudgetCount > 0 && (
                    <Animated.View
                        entering={FadeInUp}
                        className="mb-8 bg-destructive/10 border border-destructive/20 rounded-3xl p-5 flex-row items-center"
                    >
                        <View className="w-10 h-10 bg-destructive/20 rounded-full items-center justify-center mr-4">
                            <AlertTriangle size={20} color="#EF4444" />
                        </View>
                        <View className="flex-1">
                            <Typography variant="body2" weight="bold" color="destructive">{t('budgetWarning')}</Typography>
                            <Typography variant="caption" color="destructive" className="opacity-80">
                                {t('thereAre')} {overBudgetCount} {t('categories')} {t('budgetWarningDesc')}
                            </Typography>
                        </View>
                    </Animated.View>
                )}

                {/* Recent Activity */}
                <Animated.View entering={FadeInDown.delay(500).duration(800)} className="mb-5 flex-row items-center justify-between">
                    <Typography variant="h4" weight="bold">{t('recentActivity')}</Typography>
                    <AnimatedPressable onPress={() => (navigation as any).navigate('TransactionsHistoryScreen')} scaleTo={0.95}>
                        <Typography variant="body2" color="primary" weight="semibold">{t('seeAll')}</Typography>
                    </AnimatedPressable>
                </Animated.View>

                <View className="mb-24">
                    {(() => {
                        const recentTransactions = transactions
                            .filter(tx => {
                                const date = tx.created_at ? parseISO(tx.created_at) : new Date();
                                return isSameMonth(date, selectedMonth);
                            })
                            .slice(0, 3);

                        if (recentTransactions.length === 0) {
                            return (
                                <View className="items-center justify-center py-12 bg-card rounded-3xl border border-border mt-2">
                                    <Receipt size={48} color={isDark ? '#334155' : '#CBD5E1'} className="mb-4" />
                                    <Typography variant="body2" color="muted" className="text-center">
                                        {t('noTransactionsYet')}
                                    </Typography>
                                </View>
                            );
                        }

                        return recentTransactions.map((tx, index) => (
                            <Animated.View
                                key={tx.id}
                                className="mb-4"
                                entering={FadeInDown.duration(400).delay(600 + (index * 100))}
                                layout={LinearTransition.springify()}
                            >
                                <Typography variant="caption" color="muted" className="mb-2 px-1 font-medium tracking-wider">
                                    {tx.created_at ? format(parseISO(tx.created_at), 'dd MMM yyyy • HH:mm', { locale: localeID }) : t('timeNotAvailable')}
                                </Typography>
                                <AnimatedPressable
                                    className="bg-card border border-border rounded-3xl p-4 shadow-sm"
                                    onLongPress={() => handleLongPress(tx)}
                                >
                                    <TransactionItem transaction={tx} index={index} />
                                </AnimatedPressable>
                            </Animated.View>
                        ));
                    })()}
                </View>

            </ScrollView>

            <AddWalletModal
                visible={addWalletModalVisible}
                onClose={() => setAddWalletModalVisible(false)}
            />
        </SafeAreaView>
    );
}
