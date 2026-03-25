import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch, Modal, TextInput } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getStoredPin } from '../store/v2/slices/settingsSlice';

import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Folder, Wallet as WalletIcon, Moon, Globe, ScanFace, Lock, Download, ChevronRight, User as UserIcon, Bell, Check, X } from 'lucide-react-native';

import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { requestNotificationPermission } from '../lib/notifications';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';
import { RootStackParamList, Wallet, Transaction } from '../types';
import { PinModal } from '../components/PinModal';


type ProfileScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
    const { t, i18n } = useTranslation();
    const { currentTheme, toggleTheme, remindersEnabled, toggleReminders, language, setLanguage, biometricEnabled, toggleBiometric, savePin } = useStoreV2();

    const isDark = currentTheme === 'dark';
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const languages = [
        { id: 'id', name: 'Bahasa Indonesia' },
        { id: 'en', name: 'English' }
    ];

    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.auth.getSession().then(({ data: { session: s } }) => {
                    setSession(s);
                    setIsLoading(false);
                });
            } else {
                setIsLoading(false);
            }
        });
    }, []);

    const handleToggleBiometric = async (value: boolean) => {
        if (value) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!hasHardware || !isEnrolled) {
                Alert.alert(
                    t('biometricNotAvailable') || 'Biometrik Tidak Tersedia',
                    t('biometricEnrollPrompt') || 'Perangkat ini tidak mendukung atau belum mengatur biometrik. Silakan atur di pengaturan perangkat.'
                );
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t('biometricPrompt') || 'Konfirmasi identitas Anda',
                fallbackLabel: t('usePin') || 'Gunakan PIN',
                cancelLabel: t('cancel') || 'Batal',
            });
            if (result.success) {
                toggleBiometric(true);
            } else {
                Alert.alert(
                    t('biometricFailed') || 'Autentikasi Gagal',
                    t('biometricFailedMsg') || 'Biometrik tidak dapat diverifikasi.'
                );
            }
        } else {
            toggleBiometric(false);
        }
    };

    const handleOpenPin = async () => {
        const existing = await getStoredPin();
        setPinMode(existing ? 'change' : 'set');
        setShowPinModal(true);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) return;
        setIsSavingProfile(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: editName.trim() }
        });
        setIsSavingProfile(false);
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            const { data: { session: s } } = await supabase.auth.getSession();
            setSession(s);
            setShowEditModal(false);
        }
    };
    const handleToggleReminders = async (value: boolean) => {
        if (value) {
            const granted = await requestNotificationPermission();
            if (granted) {
                toggleReminders(true);
            } else {
                Alert.alert(t('permissionDenied'), t('enableNotifications'));
                toggleReminders(false);
            }
        } else {
            toggleReminders(false);
        }
    };

    const { wallets, transactions } = useStoreV2();

    const handleExportData = async () => {
        try {


            const walletHeaders = 'id,name,balance,currency,type';
            const walletRows = wallets.map((w: Wallet) =>
                `${w.id},"${w.name}",${w.balance},IDR,${w.wallet_type}`
            ).join('\n');

            const txHeaders = 'id,wallet_id,amount,type,category,note,date';
            const txRows = transactions.map((tx: Transaction) =>
                `${tx.id},${tx.wallet_id},${tx.amount},${tx.type},"${tx.category}","${tx.notes || ''}",${tx.date}`
            ).join('\n');

            const csv = `WALLETS\n${walletHeaders}\n${walletRows}\n\nTRANSACTIONS\n${txHeaders}\n${txRows}`;
            const uri = `${(FileSystem as any).documentDirectory}tukar_export.csv`;
            await FileSystem.writeAsStringAsync(uri, csv, { encoding: (FileSystem as any).EncodingType.UTF8 });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: t('exportDataTukar') });
            } else {
                Alert.alert(t('exported'), `File saved to: ${uri}`);
            }
        } catch (err: unknown) {
            Alert.alert(t('error'), err instanceof Error ? err.message : t('exportFailed'));
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            t('logoutConfirmTitle'),
            t('logoutConfirmMessage'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('logoutAction'),
                    style: "destructive",
                    onPress: async () => {
                        setIsLoggingOut(true);
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                            Alert.alert("Error", error.message);
                            setIsLoggingOut(false);
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#DB2777" />
            </SafeAreaView>
        );
    }

    const email = session?.user?.email || '';
    const displayName = session?.user?.user_metadata?.full_name || email.split('@')[0] || 'User';
    const name = displayName;
    const initial = name.charAt(0).toUpperCase();

    const SectionHeader = ({ title }: { title: string }) => (
        <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 ml-1">
            {title}
        </Text>
    );

    const MenuItem = ({ icon: Icon, title, rightText, onPress, showBorder = true }: { icon: React.ComponentType<{ size: number; color: string }>; title: string; rightText?: string; onPress?: () => void; showBorder?: boolean }) => (
        <View>
            <TouchableOpacity
                onPress={onPress}
                className="flex-row items-center gap-4 p-4 active:bg-slate-100 dark:active:bg-slate-800"
            >
                <View className="flex w-10 h-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon size={20} color="#DB2777" />
                </View>
                <Text className="flex-1 font-medium text-slate-900 dark:text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>{title}</Text>
                {rightText && <Text className="text-sm text-slate-500 dark:text-slate-400 mr-1" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>{rightText}</Text>}
                <ChevronRight size={20} color={isDark ? "#64748b" : "#cbd5e1"} />
            </TouchableOpacity>
            {showBorder && <View className="h-[1px] bg-slate-200 dark:bg-slate-800 mx-4" />}
        </View>
    );

    const MenuSwitch = ({ icon: Icon, title, value, onValueChange, showBorder = true }: { icon: React.ComponentType<{ size: number; color: string }>; title: string; value: boolean; onValueChange: (v: boolean) => void; showBorder?: boolean }) => (
        <View>
            <View className="flex-row items-center gap-4 p-4">
                <View className="flex w-10 h-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon size={20} color="#DB2777" />
                </View>
                <Text className="flex-1 font-medium text-slate-900 dark:text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>{title}</Text>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: isDark ? '#334155' : '#FCE7F3', true: '#DB2777' }}
                    thumbColor="#ffffff"
                />
            </View>
            {showBorder && <View className="h-[1px] bg-slate-200 dark:bg-slate-800 mx-4" />}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* HEADER */}
            <View className="flex-row items-center px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={isDark ? "#f8fafc" : "#DB2777"} />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold tracking-tight pr-6 text-slate-900 dark:text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{t('settings')}</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* PROFILE CARD */}
                <View className="p-4">
                    <View className="flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <View className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-sm items-center justify-center">
                            <Text className="text-2xl font-bold text-primary" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{initial}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{name.charAt(0).toUpperCase() + name.slice(1)}</Text>
                            <Text className="text-sm text-slate-500 dark:text-slate-400" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>{email}</Text>
                        </View>
                        <TouchableOpacity className="px-4 py-1.5 bg-primary/10 rounded-full" onPress={() => { setEditName(name); setShowEditModal(true); }}>
                            <Text className="text-primary text-sm font-semibold" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('edit')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="px-4">
                    {/* MANAJEMEN KEUANGAN */}
                    <View className="mb-6">
                        <SectionHeader title={t('financialManagement')} />
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <MenuItem
                                icon={Folder}
                                title={t('manageCategories')}
                                onPress={() => navigation.navigate('ManageCategoriesScreen')}
                            />
                            <MenuItem
                                icon={WalletIcon}
                                title={t('addWallet')}
                                onPress={() => navigation.navigate('AddWalletScreen')}
                            />
                            <MenuItem
                                icon={WalletIcon}
                                title={t('manageSubWallets')}
                                onPress={() => navigation.navigate('ManageWalletsScreen')}
                                showBorder={false}
                            />
                        </View>
                    </View>

                    {/* NOTIFIKASI */}
                    <View className="mb-6">
                        <SectionHeader title={t('notifications')} />
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <MenuSwitch
                                icon={Bell}
                                title={t('billReminders')}
                                value={remindersEnabled}
                                onValueChange={handleToggleReminders}
                                showBorder={false}
                            />
                        </View>
                    </View>

                    {/* TAMPILAN & BAHASA */}
                    <View className="mb-6">
                        <SectionHeader title={t('appearanceAndLanguage')} />
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <MenuSwitch
                                icon={Moon}
                                title={t('darkMode')}
                                value={isDark}
                                onValueChange={toggleTheme}
                            />
                            <MenuItem
                                icon={Globe}
                                title={t('language')}
                                rightText={language === 'id' ? 'Indonesia' : 'English'}
                                onPress={() => setShowLangModal(true)}
                                showBorder={false}
                            />
                        </View>
                    </View>

                    {/* KEAMANAN */}
                    <View className="mb-6">
                        <SectionHeader title={t('security')} />
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <MenuSwitch
                                icon={ScanFace}
                                title={t('biometricSecurity')}
                                value={biometricEnabled}
                                onValueChange={handleToggleBiometric}
                            />
                            <MenuItem
                                icon={Lock}
                                title={t('changePin')}
                                onPress={handleOpenPin}
                                showBorder={false}
                            />
                        </View>
                    </View>

                    {/* DATA */}
                    <View className="mb-6">
                        <SectionHeader title={t('data')} />
                        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <MenuItem
                                icon={Download}
                                title={t('exportData')}
                                onPress={handleExportData}
                                showBorder={false}
                            />
                        </View>
                    </View>

                    {/* LOGOUT */}
                    <View className="pt-2">
                        <TouchableOpacity
                            onPress={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-[#2A1515] items-center justify-center"
                        >
                            {isLoggingOut ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                                <Text className="text-red-500 font-semibold text-base">{t('logout')}</Text>
                            )}
                        </TouchableOpacity>
                        <Text className="text-center text-[10px] text-slate-400 dark:text-[#A0A0A0] mt-6 pb-4">
                            Tukar App v2.4.0
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* --- MODAL EDIT PROFILE --- */}
            <Modal visible={showEditModal} transparent animationType="fade">
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 pb-10">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-slate-900 dark:text-white text-lg font-bold" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{t('editProfile') || 'Edit Profil'}</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={22} color={isDark ? '#94a3b8' : '#64748b'} />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-2" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>{t('displayName') || 'Nama Tampilan'}</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder={t('enterName') || 'Masukkan nama...'}
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white mb-6"
                            style={{ fontFamily: 'PlusJakartaSans_400Regular', color: isDark ? '#f8fafc' : '#0f172a' }}
                            autoFocus
                        />
                        <TouchableOpacity
                            onPress={handleSaveProfile}
                            disabled={isSavingProfile || !editName.trim()}
                            className="w-full p-4 rounded-xl bg-primary items-center justify-center"
                        >
                            {isSavingProfile ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text className="text-white font-bold text-base" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{t('save') || 'Simpan'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* --- MODAL PILIH BAHASA --- */}
            <Modal visible={showLangModal} transparent animationType="fade">
                <View className="flex-1 justify-end bg-black/60">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 pb-10">
                        <Text className="text-slate-900 dark:text-white text-lg font-bold mb-6 text-center" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{t('chooseLanguage')}</Text>

                        {languages.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    setLanguage(item.id);
                                    setShowLangModal(false);
                                }}
                                className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border ${language === item.id ? 'border-primary bg-primary/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}
                            >
                                <Text className={`font-medium ${language === item.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`} style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                                    {item.name}
                                </Text>
                                {language === item.id && <Check size={20} color="#DB2777" />}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            onPress={() => setShowLangModal(false)}
                            className="mt-4 p-4 items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
                        >
                            <Text className="text-slate-500 dark:text-slate-400 font-bold" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PIN Modal */}
            <PinModal
                visible={showPinModal}
                mode={pinMode}
                onSuccess={() => {
                    setShowPinModal(false);
                    Alert.alert(
                        pinMode === 'set' ? t('pinCreated') : t('pinUpdated'),
                        t('pinSavedSuccess')
                    );
                }}
                onCancel={() => setShowPinModal(false)}
            />
        </SafeAreaView>
    );
}
