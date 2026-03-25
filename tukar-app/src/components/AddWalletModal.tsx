import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, CreditCard, Banknote, Check } from 'lucide-react-native';
import { Typography } from './Typography';
import { useTranslation } from 'react-i18next';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { WalletType } from '@/types';
import { supabase } from '@/lib/supabase';

interface AddWalletModalProps {
    visible: boolean;
    onClose: () => void;
}

export function AddWalletModal({ visible, onClose }: AddWalletModalProps) {
    const { addWallet } = useStoreV2();
    const { t } = useTranslation();
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<WalletType>('tunai');
    const [balance, setBalance] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    const handleSave = () => {
        if (!name.trim() || !userId) return;

        addWallet({
            name: name.trim(),
            wallet_type: type,
            balance: Number(balance.replace(/[^0-9]/g, '')) || 0
        }, userId);

        // Reset
        setName('');
        setType('tunai');
        setBalance('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end bg-black/60 bg-opacity-60 dark:bg-black/80"
            >
                <View className="bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 min-h-[60%]">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-8">
                        <View>
                            <Typography variant="h3" weight="bold">{t('addWallet')}</Typography>
                            <Typography variant="body2" className="text-slate-500 mt-1">{t('addWalletDesc')}</Typography>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="mb-8">
                        {/* Name Input */}
                        <View className="mb-6">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('walletName')}</Typography>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder={t('exampleWallet')}
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Type Selection */}
                        <View className="mb-6">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('walletType')}</Typography>
                            <View className="flex-row space-x-4">
                                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${type === 'tunai' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-800 bg-transparent'}`}
                    onPress={() => setType('tunai')}
                                >
                                    <Banknote size={20} color={type === 'tunai' ? '#EA580C' : '#64748B'} className="mr-2" />
                                    <Typography variant="body2" weight="medium" className={type === 'tunai' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}>{t('cash')}</Typography>
                                </TouchableOpacity>

                                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${type === 'kartu' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 bg-transparent'}`}
                    onPress={() => setType('kartu')}
                                >
                                    <CreditCard size={20} color={type === 'kartu' ? '#2563EB' : '#64748B'} className="mr-2" />
                                    <Typography variant="body2" weight="medium" className={type === 'kartu' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}>{t('card')}</Typography>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Initial Balance */}
                        <View className="mb-6">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('initialBalance')}</Typography>
                            <TextInput
                                value={balance}
                                onChangeText={(text) => {
                                    // Remove non-numeric characters
                                    const rawValue = text.replace(/[^0-9]/g, '');
                                    // Make sure it formats as thousand separated digits
                                    if (rawValue) {
                                        const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
                                        setBalance(formatted);
                                    } else {
                                        setBalance('');
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="Rp 0"
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View className="flex-row justify-between mt-auto">
                        <TouchableOpacity
                            className={`flex-1 py-4 rounded-xl flex-row justify-center items-center ${name.trim() ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            onPress={handleSave}
                            disabled={!name.trim()}
                        >
                            <Check size={18} color="#FFFFFF" className="mr-2" />
                            <Typography variant="body1" weight="bold" className="text-white">{t('saveWallet')}</Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
