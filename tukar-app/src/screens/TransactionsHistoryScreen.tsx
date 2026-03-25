import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, X, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { PaginatedTransactionList } from '../components/PaginatedTransactionList';
import { useStoreV2 } from '../store/v2/useStoreV2';

const MONTHS = [
    { label: 'Jan', value: '01' }, { label: 'Feb', value: '02' }, { label: 'Mar', value: '03' },
    { label: 'Apr', value: '04' }, { label: 'May', value: '05' }, { label: 'Jun', value: '06' },
    { label: 'Jul', value: '07' }, { label: 'Aug', value: '08' }, { label: 'Sep', value: '09' },
    { label: 'Oct', value: '10' }, { label: 'Nov', value: '11' }, { label: 'Dec', value: '12' },
];

const YEARS = ['2023', '2024', '2025', '2026', '2027'];
import { supabase } from '../lib/supabase'; // assuming you need this to get userId

export function TransactionsHistoryScreen() {
    const navigation = useNavigation();
    const [userId, setUserId] = useState<string>('');
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

    const { currentMonthFilter, currentYearFilter, setTransactionFilter } = useStoreV2();

    const [localMonth, setLocalMonth] = useState<string | null>(null);
    const [localYear, setLocalYear] = useState<string | null>(null);

    useEffect(() => {
        // Fetch current user ID on mount for the paginated list
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    const openFilterModal = () => {
        setLocalMonth(currentMonthFilter);
        setLocalYear(currentYearFilter);
        setIsFilterModalVisible(true);
    };

    const applyFilter = () => {
        setTransactionFilter(userId, localMonth, localYear);
        setIsFilterModalVisible(false);
    };

    const clearFilter = () => {
        setLocalMonth(null);
        setLocalYear(null);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0F172A]" edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Dynamic Background Effects */}
            <View className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
                <View className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
                <View className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
            </View>

            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between z-10">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md border border-white/10"
                >
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-white text-lg font-bold tracking-wider">Transaction History</Text>
                    {(currentMonthFilter || currentYearFilter) ? (
                        <Text className="text-white/60 text-xs mt-1">
                            {currentMonthFilter ? MONTHS.find(m => m.value === currentMonthFilter)?.label : ''} {currentYearFilter || ''}
                        </Text>
                    ) : null}
                </View>
                <TouchableOpacity
                    onPress={openFilterModal}
                    className={`w-10 h-10 rounded-full items-center justify-center backdrop-blur-md border border-white/10 ${currentMonthFilter || currentYearFilter ? 'bg-primary/30' : 'bg-white/10'}`}
                >
                    <Calendar size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* List Container - Glassmorphism Body */}
            <View className="flex-1 px-5 pt-4 z-10">
                <View className="flex-1 bg-white/5 rounded-t-[32px] border border-white/10 overflow-hidden backdrop-blur-xl shadow-2xl">
                    <View className="px-5 py-6 flex-1">
                        {userId ? (
                            <PaginatedTransactionList userId={userId} />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                {/* Can add a glassmorphism skeleton loader here */}
                                <Text className="text-white/50">Loading user session...</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View className="flex-1 justify-end">
                    {/* Backdrop */}
                    <TouchableOpacity
                        className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
                        activeOpacity={1}
                        onPress={() => setIsFilterModalVisible(false)}
                    />

                    {/* Modal Content (Glassmorphism) */}
                    <View className="bg-[#1e293b]/90 rounded-t-[32px] border-t border-white/10 overflow-hidden backdrop-blur-3xl pb-10">
                        <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
                            <Text className="text-white text-lg font-bold">Filter by Date</Text>
                            <TouchableOpacity onPress={clearFilter}>
                                <Text className="text-primary font-semibold">Clear</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="py-6">
                            <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider px-6 mb-3">Year</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                                {YEARS.map(y => (
                                    <TouchableOpacity
                                        key={y}
                                        onPress={() => setLocalYear(y)}
                                        className={`px-6 py-3 rounded-2xl border ${localYear === y ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <Text className={`font-semibold ${localYear === y ? 'text-white' : 'text-white/70'}`}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider px-6 mt-8 mb-3">Month</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                                {MONTHS.map(m => (
                                    <TouchableOpacity
                                        key={m.value}
                                        onPress={() => setLocalMonth(m.value)}
                                        className={`px-5 py-3 rounded-2xl border ${localMonth === m.value ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <Text className={`font-semibold ${localMonth === m.value ? 'text-white' : 'text-white/70'}`}>{m.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View className="px-6 flex-row gap-4 mt-2">
                            <TouchableOpacity
                                onPress={() => setIsFilterModalVisible(false)}
                                className="flex-1 py-4 rounded-full bg-white/5 border border-white/10 items-center justify-center flex-row gap-2"
                            >
                                <X size={20} color="#fff" opacity={0.7} />
                                <Text className="text-white/70 font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={applyFilter}
                                className="flex-1 py-4 rounded-full bg-primary items-center justify-center flex-row gap-2"
                            >
                                <Check size={20} color="#fff" />
                                <Text className="text-white font-bold">Apply Filter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}
