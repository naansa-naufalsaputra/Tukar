import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Wallet, CreditCard } from 'lucide-react-native';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
type AddWalletScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AddWalletScreen'>;
};

export default function AddWalletScreen({ navigation }: AddWalletScreenProps) {
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const { addWallet } = useStoreV2();

    const [name, setName] = useState('');
    const [type, setType] = useState('KARTU'); // Default tipe
    const [initialBalance, setInitialBalance] = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('oops'), t('walletNameRequired'));
            return;
        }
        if (!name.trim()) {
            Alert.alert('Oops', t('walletNameRequired'));
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert(t('error'), t('pleaseLoginAgain'));
                return;
            }
            await addWallet({
                name: name,
                wallet_type: type,
                balance: Number(initialBalance) || 0,
            }, user.id);
            Alert.alert(t('success'), t('walletAdded'));
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('failed'), t('walletSaveFailed'));
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className="flex-row items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('addWallet')}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-slate-200 dark:bg-slate-900 rounded-full">
                        <X size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                </View>

                <View className="flex-1 p-6">
                    {/* NAMA DOMPET */}
                    <View className="mb-6">
                        <Text className="text-slate-500 text-xs font-bold mb-2 tracking-widest">{t('walletName')}</Text>
                        <TextInput
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800"
                            placeholder={t('exampleWallet')}
                            placeholderTextColor={colorScheme === 'dark' ? '#475569' : '#94a3b8'}
                            value={name}
                            onChangeText={setName}
                            maxLength={20}
                            autoFocus
                        />
                    </View>

                    {/* TIPE DOMPET */}
                    <View className="mb-6">
                        <Text className="text-slate-500 text-xs font-bold mb-2 tracking-widest">{t('walletType')}</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setType('KARTU')}
                                className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${type === 'KARTU' ? 'bg-blue-600/20 border-blue-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <CreditCard size={20} color={type === 'KARTU' ? '#3b82f6' : '#64748b'} />
                                <Text className={`font-bold ${type === 'KARTU' ? 'text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{t('card')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setType('TUNAI')}
                                className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${type === 'TUNAI' ? 'bg-emerald-600/20 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                <Wallet size={20} color={type === 'TUNAI' ? '#10b981' : '#64748b'} />
                                <Text className={`font-bold ${type === 'TUNAI' ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{t('cash')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SALDO AWAL */}
                    <View className="mb-6">
                        <Text className="text-slate-500 text-xs font-bold mb-2 tracking-widest">{t('initialBalance')}</Text>
                        <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4">
                            <Text className="text-slate-500 dark:text-slate-400 font-bold mr-2">Rp</Text>
                            <TextInput
                                className="flex-1 text-slate-900 dark:text-white p-4"
                                placeholder="0"
                                placeholderTextColor={colorScheme === 'dark' ? '#475569' : '#94a3b8'}
                                keyboardType="numeric"
                                value={initialBalance}
                                onChangeText={setInitialBalance}
                            />
                        </View>
                        <Text className="text-slate-400 dark:text-slate-600 text-[10px] mt-2 ml-1">
                            *{t('initialBalanceHint')}
                        </Text>
                    </View>
                </View>

                {/* TOMBOL SIMPAN */}
                <View className="p-6 border-t border-slate-200 dark:border-slate-800">
                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-blue-600 p-4 rounded-xl items-center shadow-lg shadow-blue-500/30"
                    >
                        <Text className="text-white font-bold text-lg">{t('saveWallet')}</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
