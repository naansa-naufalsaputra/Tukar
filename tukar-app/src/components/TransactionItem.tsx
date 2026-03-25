import { MotiView } from 'moti';
import React from 'react';
import { View, Text } from 'react-native';
import * as Icons from 'lucide-react-native'; // Import semua ikon dinamis
import { useStoreV2 } from '../store/v2/useStoreV2';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';

interface TransactionItemProps {
    transaction: Transaction;
    title?: string;
    amount?: number;
    type?: string;
    category?: string;
    time?: string;
    walletName?: string;
    location?: string;
    index?: number;
}

export function TransactionItem({ transaction, title, amount, type, category, time, walletName, location, index = 0 }: TransactionItemProps) {
    const { t } = useTranslation();
    const { categories, wallets } = useStoreV2();

    const txType = type || transaction?.transaction_type || transaction?.type;
    const isExpense = txType === 'expense' || txType === 'EXPENSE';

    const categoryId = category || transaction?.category_id;
    const categoryData = categories?.find(c => c.id === categoryId);
    const categoryName = categoryData?.name || (isExpense ? t('general', 'Umum') : t('income', 'Pemasukan'));
    const iconColor = categoryData?.color_hex || (isExpense ? '#f43f5e' : '#10b981');
    const amountColor = isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
    const amountPrefix = isExpense ? '-Rp' : '+Rp';

    const IconComponent = categoryData?.icon_name
        ? (Icons as unknown as Record<string, React.ComponentType<any>>)[categoryData.icon_name]
        : (isExpense ? Icons.Utensils : Icons.Wallet);
    const ActualIcon = IconComponent || Icons.CircleDashed;

    return (
        // Card Utama
        // Card Utama
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: 'timing',
                duration: 350,
                delay: index * 100, // Stagger effect
            }}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-3 shadow-sm dark:shadow-none"
        >
            {/* Bagian Atas: Ikon, Judul, Kategori, Nominal */}
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: `${iconColor}20` }}>
                        <ActualIcon size={22} color={iconColor} />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5" numberOfLines={1}>
                            {title || transaction?.notes || transaction?.title || t('transaction', 'Transaksi')}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">{categoryName}</Text>
                    </View>
                </View>
                <Text className={`text-base font-bold tracking-tight ${amountColor}`}>
                    {amountPrefix} {(Number(amount ?? transaction?.amount) || 0).toLocaleString('id-ID')}
                </Text>
            </View>

            <View className="flex-row items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {time || (transaction?.created_at ? new Date(transaction.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '')}
                </Text>
                <Text className="text-[10px] text-slate-300 dark:text-slate-600 mx-2">•</Text>
                <Text className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">
                    {walletName || (transaction?.wallet_id && wallets?.find(w => w.id === transaction.wallet_id)?.name) || t('cash', 'Kas')}
                </Text>
                {(location || transaction?.location) && (
                    <>
                        <Text className="text-[10px] text-slate-300 dark:text-slate-600 mx-2">•</Text>
                        <Text className="text-[10px] text-slate-400 dark:text-slate-500 flex-1" numberOfLines={1}>{location || transaction?.location}</Text>
                    </>
                )}
            </View>
        </MotiView>
    );
}
