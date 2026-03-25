import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, ArrowDownToLine, ArrowUpFromLine, Check } from 'lucide-react-native';
import { Typography } from './Typography';
import { useTranslation } from 'react-i18next';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { supabase } from '@/lib/supabase';

interface AddTransactionModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
    const { wallets, addTransaction } = useStoreV2();
    const { t } = useTranslation();
    const [userId, setUserId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    useEffect(() => {
        if (!selectedWalletId && wallets.length > 0) {
            setSelectedWalletId(wallets[0].id);
        }
    }, [selectedWalletId, wallets]);

    const parsedAmount = useMemo(() => {
        const numeric = Number(amount.replace(/[^0-9]/g, '')) || 0;
        return numeric;
    }, [amount]);

    const canSave = Boolean(userId && selectedWalletId && title.trim() && parsedAmount > 0);

    const handleSave = () => {
        if (!userId || !selectedWalletId || !title.trim() || parsedAmount <= 0) return;

        addTransaction({
            amount: parsedAmount,
            category_id: category.trim() || null,
            wallet_id: selectedWalletId,
            transaction_type: type.toUpperCase() as 'EXPENSE' | 'INCOME' | 'TRANSFER',
            notes: title.trim(),
        }, userId);

        setTitle('');
        setCategory('');
        setAmount('');
        setType('expense');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end bg-black/60 bg-opacity-60 dark:bg-black/80"
            >
                <View className="bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 min-h-[65%]">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Typography variant="h3" weight="bold">{t('addTransaction')}</Typography>
                            <Typography variant="body2" className="text-slate-500 mt-1">{t('addTransactionDesc')}</Typography>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
                        {/* Type */}
                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('transactionType')}</Typography>
                            <View className="flex-row space-x-4">
                                <TouchableOpacity
                                    className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${type === 'expense' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-800'}`}
                                    onPress={() => setType('expense')}
                                >
                                    <ArrowUpFromLine size={18} color={type === 'expense' ? '#E11D48' : '#64748B'} className="mr-2" />
                                    <Typography variant="body2" weight="medium" className={type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}>
                                        {t('expense')}
                                    </Typography>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${type === 'income' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800'}`}
                                    onPress={() => setType('income')}
                                >
                                    <ArrowDownToLine size={18} color={type === 'income' ? '#10B981' : '#64748B'} className="mr-2" />
                                    <Typography variant="body2" weight="medium" className={type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                                        {t('income')}
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Title */}
                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('title')}</Typography>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t('exampleTitle')}
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Category */}
                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('category')}</Typography>
                            <TextInput
                                value={category}
                                onChangeText={setCategory}
                                placeholder={t('exampleTransport')}
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Amount */}
                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('amount')}</Typography>
                            <TextInput
                                value={amount}
                                onChangeText={(text) => {
                                    const rawValue = text.replace(/[^0-9]/g, '');
                                    if (rawValue) {
                                        const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
                                        setAmount(formatted);
                                    } else {
                                        setAmount('');
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="Rp 0"
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Wallet */}
                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('fundSource')}</Typography>
                            {wallets.length === 0 ? (
                                <View className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                                    <Typography variant="body2" className="text-slate-500">{t('addWalletFirst')}</Typography>
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap -ml-2">
                                    {wallets.map((wallet) => (
                                        <TouchableOpacity
                                            key={wallet.id}
                                            onPress={() => setSelectedWalletId(wallet.id)}
                                            className={`ml-2 mb-2 px-4 py-2 rounded-xl border ${selectedWalletId === wallet.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-800'}`}
                                        >
                                            <Typography variant="body2" weight="medium" className={selectedWalletId === wallet.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}>
                                                {wallet.name}
                                            </Typography>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Action */}
                    <View className="flex-row justify-between mt-auto">
                        <TouchableOpacity
                            className={`flex-1 py-4 rounded-xl flex-row justify-center items-center ${canSave ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            onPress={handleSave}
                            disabled={!canSave}
                        >
                            <Check size={18} color="#FFFFFF" className="mr-2" />
                            <Typography variant="body1" weight="bold" className="text-white">{t('saveTransaction')}</Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
