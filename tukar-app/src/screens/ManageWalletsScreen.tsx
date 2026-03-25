import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Wallet, CreditCard, Landmark, ChevronDown } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { RootStackParamList } from '../types';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';

type ManageWalletsScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ManageWalletsScreen'>;
};

export default function ManageWalletsScreen({ navigation }: ManageWalletsScreenProps) {
    const { t } = useTranslation();
    const { wallets, addWallet } = useStoreV2();

    // State untuk Modal Tambah Dompet
    const [modalVisible, setModalVisible] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletBalance, setNewWalletBalance] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null); // null = Dompet Utama

    // Pisahkan Dompet Utama dan Sub-Dompet
    const mainWallets = wallets?.filter(w => !w.parent_wallet_id) || [];
    const getSubWallets = (parentId: string) => wallets?.filter(w => w.parent_wallet_id === parentId) || [];

    const handleSaveWallet = async () => {
        if (!newWalletName) {
            Alert.alert('Oops', t('walletNameEmpty'));
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', t('pleaseLoginAgain'));
                return;
            }

            await addWallet({
                name: newWalletName,
                wallet_type: selectedParentId ? 'SUB_WALLET' : 'KARTU',
                balance: Number(newWalletBalance) || 0,
                parent_wallet_id: selectedParentId,
            }, user.id);

            setModalVisible(false);
            setNewWalletName('');
            setNewWalletBalance('');
            setSelectedParentId(null);
        } catch (error) {
            Logger.error('Failed to save wallet', error);
            Alert.alert('Error', t('walletSaveError'));
        }
    };

    const openAddModal = (parentId: string | null = null) => {
        setSelectedParentId(parentId);
        setModalVisible(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-950">
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-900">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 rounded-full bg-gray-100 dark:bg-slate-900">
                        <ArrowLeft size={20} color="#94a3b8" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">{t('manageWallets')}</Text>
                </View>
                <TouchableOpacity onPress={() => openAddModal(null)} className="p-2 rounded-full bg-blue-600/20">
                    <Plus size={20} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {/* LIST DOMPET */}
            <ScrollView className="flex-1 px-6 pt-6">
                {mainWallets.map(main => {
                    const subs = getSubWallets(main.id);

                    return (
                        <View key={main.id} className="mb-6">
                            {/* KARTU DOMPET UTAMA */}
                            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
                                        <Landmark size={20} color="#3b82f6" />
                                    </View>
                                    <View>
                                        <Text className="text-base font-bold text-gray-900 dark:text-white">{main.name}</Text>
                                        <Text className="text-xs text-gray-500 dark:text-slate-400 font-medium">Rp {Number(main.balance).toLocaleString('id-ID')}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => openAddModal(main.id)} className="bg-gray-100 dark:bg-slate-800 p-2 rounded-xl">
                                    <Plus size={16} color="#cbd5e1" />
                                </TouchableOpacity>
                            </View>

                            {/* LIST SUB-DOMPET (Jika ada) */}
                            {subs.length > 0 && (
                                <View className="pl-6 pr-2 mt-2 border-l-2 border-gray-200 dark:border-slate-800 ml-5">
                                    {subs.map(sub => (
                                        <View key={sub.id} className="flex-row items-center justify-between py-3 border-b border-gray-200/50 dark:border-slate-800/50">
                                            <View className="flex-row items-center gap-3">
                                                <Wallet size={16} color="#94a3b8" />
                                                <View>
                                                    <Text className="text-sm font-semibold text-gray-700 dark:text-slate-200">{sub.name}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-xs font-bold text-emerald-400">Rp {Number(sub.balance).toLocaleString('id-ID')}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* MODAL TAMBAH DOMPET */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-gray-50 dark:bg-slate-950 rounded-t-3xl p-6 border-t border-gray-200 dark:border-slate-800">
                        <View className="items-center mb-6">
                            <View className="w-12 h-1.5 bg-gray-300 dark:bg-slate-800 rounded-full mb-4" />
                            <Text className="text-lg font-bold text-gray-900 dark:text-white">
                                {selectedParentId ? t('addSubWallet') : t('addMainAccount')}
                            </Text>
                        </View>

                        <Text className="text-xs font-bold text-gray-500 dark:text-slate-500 mb-2">{t('walletNameLabel')}</Text>
                        <TextInput
                            className="bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-slate-800 mb-4 font-semibold"
                            placeholder={selectedParentId ? t('subWalletPlaceholder') : t('mainWalletPlaceholder')}
                            placeholderTextColor="#475569"
                            value={newWalletName}
                            onChangeText={setNewWalletName}
                        />

                        <Text className="text-xs font-bold text-gray-500 dark:text-slate-500 mb-2">{t('initialBalanceLabel')}</Text>
                        <TextInput
                            className="bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-slate-800 mb-8 font-semibold"
                            placeholder="0"
                            placeholderTextColor="#475569"
                            keyboardType="numeric"
                            value={newWalletBalance}
                            onChangeText={setNewWalletBalance}
                        />

                        <View className="flex-row gap-4 mb-4">
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 p-4 rounded-xl bg-gray-100 dark:bg-slate-900 items-center">
                                <Text className="text-gray-600 dark:text-slate-300 font-bold">{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveWallet} className="flex-1 p-4 rounded-xl bg-blue-600 items-center shadow-lg shadow-blue-600/30">
                                <Text className="text-white font-bold">{t('save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
