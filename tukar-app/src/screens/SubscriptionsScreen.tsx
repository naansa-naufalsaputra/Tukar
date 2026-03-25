import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, CheckCircle, MonitorPlay, Music, Youtube, Home, CreditCard, Plus, X } from 'lucide-react-native';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { supabase } from '../lib/supabase';
import { scheduleSubscriptionNotifications, scheduleAllSubscriptionNotifications } from '../lib/notifications';
import { Subscription } from '../types';
import { Logger } from '../lib/logger';
import { useTranslation } from 'react-i18next';

export default function SubscriptionsScreen() {
    const { t } = useTranslation();
    // Ambil data dari Zustand
    const { subscriptions, wallets, addTransaction, addSubscription, deleteSubscription } = useStoreV2();

    // State untuk Modal Tambah Langganan
    const [isModalVisible, setModalVisible] = useState(false);
    const [subName, setSubName] = useState('');
    const [subAmount, setSubAmount] = useState('');
    const [subDate, setSubDate] = useState('');

    // 🔔 Schedule notifikasi saat screen pertama kali dimuat
    useEffect(() => {
        if (subscriptions?.length > 0) {
            const subList = subscriptions.map((s: Subscription) => ({
                id: s.id,
                service_name: s.name || s.service_name || 'Langganan',
                amount: Number(s.amount),
                billing_date: Number(s.billing_date),
            }));
            scheduleAllSubscriptionNotifications(subList).catch((err) => Logger.error('SubscriptionsScreen', err));
        }
    }, [subscriptions]);

    // 🧠 KALKULASI TOTAL OTOMATIS
    const totalBill = useMemo(() => {
        if (!subscriptions) return 0;
        return subscriptions.reduce((acc, curr) => acc + Number(curr.amount), 0);
    }, [subscriptions]);

    const getSubIcon = (name: string) => {
        const lowerName = (name || '').toLowerCase();
        if (lowerName.includes('netflix')) return <MonitorPlay size={24} color="#ef4444" />;
        if (lowerName.includes('spotify')) return <Music size={24} color="#10b981" />;
        if (lowerName.includes('youtube')) return <Youtube size={24} color="#ef4444" />;
        if (lowerName.includes('kos') || lowerName.includes('kontrakan')) return <Home size={24} color="#eab308" />;
        return <CreditCard size={24} color="#3b82f6" />;
    };

    const getStatus = (dueDay: number) => {
        const today = new Date().getDate(); // Misal: 26
        if (today > dueDay) {
            return { label: t('upcoming'), color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
        }
        return { label: t('comingSoon'), color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
    };

    // 💰 EKSEKUSI PEMBAYARAN LANGSUNG KE TRANSAKSI
    const handlePayNow = (item: Subscription) => {
        Alert.alert(
            t('payBill'),
            t('payBillConfirm', { amount: Number(item.amount).toLocaleString('id-ID'), name: item.name || item.service_name }),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('pay'),
                    onPress: async () => {
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return Alert.alert(t('error'), t('sessionInvalid'));

                            // Asumsi bayar pakai dompet pertama (Cash/Tunai). Bisa dikembangkan nanti.
                            const defaultWallet = wallets?.[0]?.id;
                            if (!defaultWallet) return Alert.alert(t('error'), t('walletNotFound'));

                            await addTransaction({
                                wallet_id: defaultWallet,
                                amount: item.amount,
                                transaction_type: 'EXPENSE',
                                notes: t('payBillNote', { name: item.name || item.service_name }),
                                // category_id: null (opsional, bisa disambung ke kategori Tagihan)
                            }, user.id);
                            Alert.alert(t('success'), t('paySuccess', { name: item.name || item.service_name }));
                        } catch (e) {
                            Alert.alert(t('error'), t('payFailed'));
                        }
                    }
                }
            ]
        );
    };

    // 📝 EKSEKUSI SIMPAN LANGGANAN BARU
    const handleSaveNewSub = async () => {
        const rawAmount = Number(subAmount.replace(/[^0-9]/g, ''));

        if (!subName || !subAmount || !subDate) {
            return Alert.alert(t('warning'), t('completeAllSubData'));
        }
        const dateNum = Number(subDate);
        if (dateNum < 1 || dateNum > 31) {
            return Alert.alert(t('warning'), t('invalidBillingDate'));
        }

        try {
            await addSubscription({
                service_name: subName,
                amount: rawAmount,
                due_date: String(dateNum),


            });
            // Schedule notifikasi untuk langganan yang baru saja ditambah
            await scheduleSubscriptionNotifications({
                id: Date.now().toString(), // temporary, store will refresh
                service_name: subName,
                amount: rawAmount,
                billing_date: dateNum,
            });
            setModalVisible(false);
            setSubName(''); setSubAmount(''); setSubDate('');
            Alert.alert(t('success'), t('subscriptionAdded'));
        } catch (e) {
            Alert.alert(t('error'), t('subscriptionSaveError'));
        }
    };

    // 🗑️ FUNGSI HAPUS LANGGANAN (Long Press)
    const handleLongPress = (item: Subscription) => {
        Alert.alert(t('subscriptionOptions'), t('deleteSubscriptionConfirm', { name: item.name || item.service_name }), [
            { text: t('cancel'), style: "cancel" },
            { text: t('delete'), style: "destructive", onPress: () => deleteSubscription(item.id) }
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* HEADER & TOMBOL TAMBAH */}
            <View className="flex-row items-center px-6 py-4 border-b border-slate-200 dark:border-slate-900 justify-between">
                <View className="w-8" />
                <Text className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">{t('recurringSubscriptions')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} className="w-8 h-8 bg-blue-100 dark:bg-blue-600/20 rounded-full items-center justify-center">
                    <Plus size={20} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* SUMMARY CARD */}
                <View className="p-6">
                    <LinearGradient
                        colors={['#136dec', '#2563eb']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        className="relative overflow-hidden rounded-2xl p-6 shadow-lg"
                    >
                        <View className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
                        <View className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-blue-300/20" />
                        <View className="relative z-10 flex-col gap-2">
                            <Text className="text-blue-100 text-xs font-medium tracking-widest uppercase">{t('totalBillThisMonth')}</Text>
                            <Text className="text-white text-4xl font-extrabold tracking-tight mt-1">
                                Rp {totalBill.toLocaleString('id-ID')}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* LIST TAGIHAN (DARI SUPABASE) */}
                <View className="px-6 pb-24 mt-2">
                    {subscriptions?.length === 0 ? (
                        <Text className="text-slate-500 text-center mt-10">{t('noSubscriptionsYet')}</Text>
                    ) : (
                        subscriptions?.map((item: Subscription) => {
                            const billingDate = item.billing_date ?? new Date().getDate();
                            const status = getStatus(billingDate);
                            // isOverdue logic remains for the button actions below
                            const today = new Date().getDate();
                            const diff = billingDate - today;
                            const isOverdue = diff < 0;

                            return (
                                <View key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-row items-center gap-3">
                                            <View className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 items-center justify-center border border-slate-100 dark:border-slate-800">
                                                {getSubIcon(item.name || item.service_name)}
                                            </View>
                                            <View>
                                                <Text className="font-bold text-slate-900 dark:text-white text-base">{item.name || item.service_name}</Text>
                                                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('dueDate')} {item.billing_date}</Text>
                                            </View>
                                        </View>
                                        <View className="items-end gap-1.5">
                                            <Text className="text-base font-bold text-slate-900 dark:text-white">Rp {Number(item.amount || 0).toLocaleString('id-ID')}</Text>
                                            <View className={`px-2.5 py-1 rounded-full border ${status.color}`}>
                                                <Text className={`text-[10px] font-bold uppercase ${status.color.split(' ').find(c => c.startsWith('text-') && !c.startsWith('dark:'))} ${status.color.split(' ').find(c => c.startsWith('dark:text-'))}`}>
                                                    {status.label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {isOverdue && (
                                        <View className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 flex-row gap-2">
                                            <TouchableOpacity onPress={() => handlePayNow(item)} className="flex-1 items-center justify-center rounded-xl bg-blue-600 py-3 active:bg-blue-700">
                                                <Text className="text-sm font-bold text-white">{t('recordPayment')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleLongPress(item)} className="w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/20 active:bg-rose-200 dark:active:bg-rose-900/40">
                                                <Text className="text-sm font-bold text-rose-600 dark:text-rose-400">✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {!isOverdue && (
                                        <View className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                            <TouchableOpacity onPress={() => handleLongPress(item)} className="w-full items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 py-3 active:bg-slate-100 dark:active:bg-slate-700">
                                                <Text className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('deleteSubscription')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* MODAL TAMBAH LANGGANAN */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-white dark:bg-slate-950 rounded-t-3xl p-6 border-t border-slate-200 dark:border-slate-800">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('newSubscription')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><X color="#64748b" /></TouchableOpacity>
                        </View>

                        <Text className="text-slate-500 font-bold mb-2">{t('serviceName')}</Text>
                        <TextInput className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4" placeholder={t('serviceNamePlaceholder')} placeholderTextColor="#94a3b8" value={subName} onChangeText={setSubName} />

                        <Text className="text-slate-500 font-bold mb-2">{t('monthlyCost')}</Text>
                        <TextInput
                            className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4"
                            placeholder="0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={subAmount}
                            onChangeText={(text) => {
                                const rawValue = text.replace(/[^0-9]/g, '');
                                if (rawValue) {
                                    setSubAmount(Number(rawValue).toLocaleString('id-ID'));
                                } else {
                                    setSubAmount('');
                                }
                            }}
                        />

                        <Text className="text-slate-500 font-bold mb-2">{t('billingDateLabel')}</Text>
                        <TextInput className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-8" placeholder={t('billingDatePlaceholder')} placeholderTextColor="#94a3b8" keyboardType="numeric" maxLength={2} value={subDate} onChangeText={setSubDate} />

                        <TouchableOpacity onPress={handleSaveNewSub} className="bg-blue-600 p-4 rounded-xl items-center shadow-lg shadow-blue-500/30 mb-8">
                            <Text className="text-white font-bold text-lg">{t('saveSubscription')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
