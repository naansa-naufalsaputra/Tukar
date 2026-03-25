import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStoreV2 } from '../store/v2/useStoreV2';
import * as Icons from 'lucide-react-native';
import { X, Settings2, Calendar, Wallet, ArrowRightLeft, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { SuccessModal } from '../components/animations/SuccessModal';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, CategoryType } from '../types';
import { Logger } from '../lib/logger';

const TABS: { id: 'EXPENSE' | 'INCOME' | 'TRANSFER'; labelKey: string; color: string }[] = [
    { id: 'EXPENSE', labelKey: 'expense', color: 'bg-rose-500' },
    { id: 'INCOME', labelKey: 'income', color: 'bg-emerald-500' },
    { id: 'TRANSFER', labelKey: 'transfer', color: 'bg-blue-500' },
];

export default function AddTransactionScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'AddTransactionScreen'>) {
    const { t } = useTranslation();
    const { categories, wallets, selectedMonth, addTransaction, updateTransaction, deleteTransaction, currentTheme, getCategoryUsage, suggestCategory } = useStore();
    const isDark = currentTheme === 'dark';
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [location, setLocation] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(wallets?.[0]?.id || null);
    const [destinationWallet, setDestinationWallet] = useState<string | null>(null);

    // New States for Date and Modals
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showDestWalletModal, setShowDestWalletModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
    // Sync default wallet if wallets loaded later
    useEffect(() => {
        if (!selectedWallet && wallets && wallets.length > 0) {
            setSelectedWallet(wallets[0].id);
        }
    }, [wallets, selectedWallet]);

    // Auto-Location
    useEffect(() => {
        (async () => {
            try {
                setIsLocating(true);
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                const geocode = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });

                if (geocode.length > 0) {
                    const place = geocode[0];
                    const addressName = place.street || place.district || place.subregion || t('unknownLocation');
                    setLocation(`${addressName}, ${place.city || ''}`);
                }
            } catch (error) {
                Logger.warn('Failed to get auto-location:', error);
            } finally {
                setIsLocating(false);
            }
        })();
    }, []);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    // Prefill data for Edit UX Hack & Smart Input
    useEffect(() => {
        const tx: Record<string, unknown> | undefined = route?.params?.editData as Record<string, unknown> | undefined;
        if (tx && (tx.category || tx.amount || tx.title)) {
            if (tx.amount) {
                setAmount(new Intl.NumberFormat('id-ID').format(tx.amount as number));
            }
            if (tx.title || tx.notes) {
                setNotes((tx.title as string) || (tx.notes as string) || '');
            }
            if (tx.date) {
                setDate(new Date(tx.date as string));
            }

            // Map transaction type correctly
            const rawType = ((tx.transaction_type as string) || (tx.type as string) || '').toUpperCase();
            if (['EXPENSE', 'INCOME', 'TRANSFER'].includes(rawType)) {
                setActiveTab(rawType as 'EXPENSE' | 'INCOME' | 'TRANSFER');
            }

            // Handle IDs (Edit Mode)
            if (tx.category_id) setSelectedCategory(tx.category_id as string);
            if (tx.wallet_id) setSelectedWallet(tx.wallet_id as string);
            if (tx.destination_wallet_id) setDestinationWallet(tx.destination_wallet_id as string);

            // Handle Names (Smart Input Mode)
            const catName = (tx.categoryName as string) || (tx.category as string);
            if (catName && categories) {
                const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
                if (matchedCat) setSelectedCategory(matchedCat.id);
            }

            const walName = (tx.walletName as string) || (tx.wallet as string);
            if (walName && wallets) {
                const matchedWallet = wallets.find(w => w.name.toLowerCase() === walName.toLowerCase());
                if (matchedWallet) setSelectedWallet(matchedWallet.id);
            }
        }
    }, [route?.params, categories, wallets]);

    const filteredCategories = useMemo(() => {
        return categories?.filter(cat => cat.type.toUpperCase() === activeTab.toUpperCase()) || [];
    }, [categories, activeTab]);

    // LOGIKA SMART AUTO-CATEGORIZATION
    useEffect(() => {
        if (notes.length > 2 && activeTab === 'EXPENSE' && !selectedCategory) {
            const suggestedId = suggestCategory(notes);
            if (suggestedId) {
                setSelectedCategory(suggestedId);
            }
        }
    }, [notes, activeTab, suggestCategory, selectedCategory]);
    useEffect(() => {
        if (notes.length > 2 && activeTab === 'EXPENSE' && !selectedCategory) {
            const text = notes.toLowerCase();
            if (text.includes('makan') || text.includes('minum') || text.includes('kopi')) {
                const catMakan = filteredCategories.find(c => c.name.toLowerCase().includes('makan'));
                if (catMakan) setSelectedCategory(catMakan.id);
            } else if (text.includes('gojek') || text.includes('grab') || text.includes('bensin') || text.includes('ojek')) {
                const catTransport = filteredCategories.find(c => c.name.toLowerCase().includes('transport'));
                if (catTransport) setSelectedCategory(catTransport.id);
            } else if (text.includes('belanja') || text.includes('beli') || text.includes('shopee') || text.includes('tokopedia')) {
                const catShop = filteredCategories.find(c => c.name.toLowerCase().includes('belanj'));
                if (catShop) setSelectedCategory(catShop.id);
            }
        }
    }, [notes, activeTab, filteredCategories]);

    const parsedAmount = useMemo(() => {
        return Number(amount.replace(/[^0-9]/g, '')) || 0;
    }, [amount]);

    const { remainingBudget, isOverBudget } = useMemo(() => {
        if (activeTab !== 'EXPENSE' || !selectedCategory || parsedAmount <= 0) {
            return { remainingBudget: 0, isOverBudget: false };
        }

        const usage = getCategoryUsage(selectedCategory, selectedMonth);
        if (!usage.limit || usage.limit <= 0) return { remainingBudget: 0, isOverBudget: false };

        const willBeOver = (usage.total + parsedAmount) > usage.limit;
        const remaining = usage.limit - usage.total;

        return {
            remainingBudget: remaining,
            isOverBudget: willBeOver,
        };
    }, [activeTab, selectedCategory, parsedAmount, getCategoryUsage, selectedMonth]);

    const handleSave = async () => {
        if (!amount || !notes || !selectedWallet) {
            Alert.alert('Oops', t('fillRequiredFields'));
            return;
        }

        if (parsedAmount <= 0) {
            Alert.alert('Oops', t('enterValidAmount'));
            return;
        }

        if (activeTab !== 'TRANSFER' && !selectedCategory) {
            Alert.alert('Oops', t('selectCategoryFirst'));
            return;
        }

        if (activeTab === 'TRANSFER' && !destinationWallet) {
            Alert.alert('Oops', t('selectDestinationWallet'));
            return;
        }

        if (!userId) {
            Alert.alert(t('error'), t('invalidUserSession'));
            return;
        }

        const txToEdit = route?.params?.editData;

        const saveTransaction = async () => {
            try {
                const payload = {
                    wallet_id: selectedWallet,
                    destination_wallet_id: activeTab === 'TRANSFER' ? destinationWallet : null,
                    amount: parsedAmount,
                    transaction_type: activeTab,
                    notes: notes.trim(),
                    category_id: activeTab === 'TRANSFER' ? null : selectedCategory,
                    location: location.trim() || null,
                    date: date.toISOString(),
                };

                if (txToEdit && userId) {
                    await updateTransaction(txToEdit.id, payload, userId);
                } else {
                    await addTransaction(payload, userId);
                }
                setShowSuccess(true);
            } catch (error) {
                Alert.alert(t('failed'), t('errorSavingTransaction'));
            }
        };

        if (isOverBudget) {
            Alert.alert(
                t('budgetExceeded'),
                t('sureToSave'),
                [
                    { text: t('cancel'), style: "cancel" },
                    { text: t('continue'), style: "destructive", onPress: saveTransaction }
                ]
            );
        } else {
            saveTransaction();
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const selectedCategoryObj = categories?.find(c => c.id === selectedCategory);
    const selectedWalletObj = wallets?.find(w => w.id === selectedWallet);
    const destWalletObj = wallets?.find(w => w.id === destinationWallet);

    const SelectionRow = ({ icon: Icon, label, value, onPress, color = "#64748B" }: {
        icon: React.ComponentType<{ size: number; color: string }>;
        label: string;
        value?: string;
        onPress: () => void;
        color?: string;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 shadow-sm"
        >
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: color + '20' }}>
                    <Icon size={20} color={color} />
                </View>
                <View>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">{label}</Text>
                    <Text className="text-slate-900 dark:text-white font-medium text-base">{value || t('select')}</Text>
                </View>
            </View>
            <ChevronRight size={20} color={isDark ? "#64748B" : "#94A3B8"} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                {/* TOP NAV MODAL HEADER */}
                <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="py-2 pr-4">
                        <Text className="text-slate-500 dark:text-slate-400 font-medium text-base">{t('cancel')}</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('addTransaction')}</Text>
                    <View className="w-12" /> {/* Spacer to center the title */}
                </View>

                {/* 1. HEADER TABS */}
                <View className="flex-row mx-6 mt-4 p-1 bg-slate-200 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800">
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => {
                                setActiveTab(tab.id);
                                setSelectedCategory(null);
                            }}
                            className={`flex-1 py-3 items-center rounded-lg ${activeTab === tab.id ? tab.color : 'bg-transparent'}`}
                        >
                            <Text className={`font-bold text-sm ${activeTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-500'}`}>
                                {t(tab.labelKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
                    {/* 2. INPUT NOMINAL */}
                    <View className="items-center justify-center mb-8 w-full">
                        <Text className="text-slate-500 text-xs font-bold tracking-widest mb-2" numberOfLines={1}>
                            {t('transactionAmount')}
                        </Text>
                        <View className="flex-row items-center justify-center w-full px-6">
                            <Text className="text-slate-900 dark:text-white text-4xl font-bold mr-2">Rp</Text>
                            <TextInput
                                className="text-slate-900 dark:text-white text-6xl font-extrabold pb-0 m-0 flex-1"
                                style={{ includeFontPadding: false }}
                                placeholder="0"
                                placeholderTextColor={isDark ? "#334155" : "#CBD5E1"}
                                keyboardType="numeric"
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
                                autoFocus
                            />
                        </View>
                        {isOverBudget && (
                            <Text className="text-red-500 text-sm font-bold mt-2">
                                ⚠️ {t('budgetExceeded')} ({t('remaining')}: Rp {new Intl.NumberFormat('id-ID').format(Math.max(0, remainingBudget))})!
                            </Text>
                        )}
                    </View>

                    {/* 3. INPUT CATATAN */}
                    <View className="mb-6">
                        <Text className="text-slate-500 text-xs font-bold mb-3 tracking-wider">{t('transactionNotes')}</Text>
                        <TextInput
                            className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-medium text-base shadow-sm"
                            placeholder={t('exampleNotes')}
                            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* 4. ROW-BASED SELECTIONS */}
                    <View className="mb-8">
                        <Text className="text-slate-500 text-xs font-bold mb-3 tracking-wider">{t('transactionDetails')}</Text>

                        <SelectionRow
                            icon={Calendar}
                            label={t('date')}
                            value={formatDate(date)}
                            onPress={() => setShowDatePicker(true)}
                            color="#3B82F6"
                        />

                        {activeTab !== 'TRANSFER' && (
                            <SelectionRow
                                icon={selectedCategoryObj ? ((Icons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[selectedCategoryObj.icon_name] || Icons.CircleDashed) : Icons.Grid}
                                label={t('category')}
                                value={selectedCategoryObj?.name}
                                onPress={() => setShowCategoryModal(true)}
                                color={selectedCategoryObj?.color_hex || "#0ea5e9"}
                            />
                        )}

                        <SelectionRow
                            icon={Wallet}
                            label={activeTab === 'TRANSFER' ? t('fromWallet') : t('wallet')}
                            value={selectedWalletObj?.name}
                            onPress={() => setShowWalletModal(true)}
                            color="#10B981"
                        />

                        {activeTab === 'TRANSFER' && (
                            <SelectionRow
                                icon={ArrowRightLeft}
                                label={t('toWallet')}
                                value={destWalletObj?.name}
                                onPress={() => setShowDestWalletModal(true)}
                                color="#F59E0B"
                            />
                        )}
                    </View>

                    {/* 5. INPUT LOKASI */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-slate-500 text-xs font-bold tracking-wider">{t('locationOptional')}</Text>
                            {isLocating && (
                                <View className="flex-row items-center">
                                    <ActivityIndicator size="small" color="#3B82F6" className="mr-2" />
                                    <Text className="text-blue-500 text-xs italic">{t('searchingLocation')}</Text>
                                </View>
                            )}
                        </View>
                        <TextInput
                            className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-medium text-base shadow-sm"
                            placeholder={t('exampleLocation')}
                            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>
                </ScrollView>

                {/* TOMBOL SIMPAN */}
                <View className="p-6 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-900 pt-4">
                    <TouchableOpacity
                        onPress={handleSave}
                        className={`p-4 rounded-xl items-center shadow-md ${parsedAmount > 0 && notes.trim() && (selectedCategory || activeTab === 'TRANSFER')
                            ? 'bg-blue-600 dark:bg-blue-500 shadow-blue-500/30'
                            : 'bg-slate-300 dark:bg-slate-800'
                            }`}
                        disabled={!(parsedAmount > 0 && notes.trim() && (selectedCategory || activeTab === 'TRANSFER'))}
                    >
                        <Text className={`font-bold text-lg ${parsedAmount > 0 && notes.trim() && (selectedCategory || activeTab === 'TRANSFER') ? 'text-white' : 'text-slate-500'}`}>
                            {t('save')} {(parsedAmount > 0) ? `Rp ${new Intl.NumberFormat('id-ID').format(parsedAmount)}` : t('transaction')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* DATE PICKER */}
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            {/* CATEGORY MODAL */}
            <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('selectCategory')}</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <X size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredCategories.map(cat => {
                                const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[cat.icon_name] || Icons.CircleDashed;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => { setSelectedCategory(cat.id); setShowCategoryModal(false); }}
                                        className="flex-row items-center p-4 border-b border-slate-100 dark:border-slate-800"
                                    >
                                        <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: cat.color_hex + '20' }}>
                                            <IconComponent size={24} color={cat.color_hex} />
                                        </View>
                                        <Text className="text-slate-900 dark:text-white font-medium text-lg">{cat.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* WALLET MODAL */}
            <Modal visible={showWalletModal} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('selectWallet')}</Text>
                            <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                                <X size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {wallets?.map(wallet => (
                                <TouchableOpacity
                                    key={wallet.id}
                                    onPress={() => { setSelectedWallet(wallet.id); setShowWalletModal(false); }}
                                    className="flex-row items-center p-4 border-b border-slate-100 dark:border-slate-800"
                                >
                                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-blue-100 dark:bg-blue-900/30">
                                        <Wallet size={24} color="#3B82F6" />
                                    </View>
                                    <Text className="text-slate-900 dark:text-white font-medium text-lg">{wallet.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* DESTINATION WALLET MODAL */}
            <Modal visible={showDestWalletModal} animationType="slide" transparent={true}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('selectDestinationWallet')}</Text>
                            <TouchableOpacity onPress={() => setShowDestWalletModal(false)}>
                                <X size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {wallets?.filter(w => w.id !== selectedWallet).map(wallet => (
                                <TouchableOpacity
                                    key={wallet.id}
                                    onPress={() => { setDestinationWallet(wallet.id); setShowDestWalletModal(false); }}
                                    className="flex-row items-center p-4 border-b border-slate-100 dark:border-slate-800"
                                >
                                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-emerald-100 dark:bg-emerald-900/30">
                                        <Wallet size={24} color="#10B981" />
                                    </View>
                                    <Text className="text-slate-900 dark:text-white font-medium text-lg">{wallet.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <SuccessModal visible={showSuccess} onHide={() => {
                setShowSuccess(false);
                navigation.goBack();
            }} />
        </SafeAreaView>
    );
}
