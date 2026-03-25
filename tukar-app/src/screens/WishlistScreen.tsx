import React, { useMemo, useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Dimensions, ScrollView, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { Goal, RootStackParamList } from '@/types';
import { Lock, Plus, ArrowLeft, PiggyBank, Smartphone, Plane, Home as HomeIcon, MoreHorizontal, Trash2 } from 'lucide-react-native';
import { Typography } from '@/components/Typography';
import { AddGoalModal } from '@/components/AddGoalModal';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // Mengatur lebar kartu untuk 2 kolom (padding 24x2 + gap 16)

type WishlistScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Wishlist'>;
};

export default function WishlistScreen({ navigation }: WishlistScreenProps) {
    const { t } = useTranslation();
    const { goals, currentTheme, deleteGoal } = useStoreV2();
    const isDark = currentTheme === 'dark';
    const [addGoalVisible, setAddGoalVisible] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const displayGoals = goals || [];

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id || null);
        });
    }, []);

    const totalLocked = useMemo(() => {
        return displayGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    }, [displayGoals]);

    const formattedTotalLocked = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(totalLocked);

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Electronic': return { icon: <Smartphone size={20} color={isDark ? "#60A5FA" : "#2563EB"} />, bg: 'bg-blue-100 dark:bg-blue-900/40' };
            case 'Travel': return { icon: <Plane size={20} color={isDark ? "#34D399" : "#059669"} />, bg: 'bg-emerald-100 dark:bg-emerald-900/40' };
            case 'Family': return { icon: <HomeIcon size={20} color={isDark ? "#FBBF24" : "#D97706"} />, bg: 'bg-orange-100 dark:bg-orange-900/40' };
            default: return { icon: <MoreHorizontal size={20} color={isDark ? "#9CA3AF" : "#4B5563"} />, bg: 'bg-slate-100 dark:bg-slate-800' };
        }
    };

    const renderGoalCard = ({ item }: { item: Goal | { id: string, isAddButton: boolean } }) => {
        if ('isAddButton' in item) {
            return (
                <TouchableOpacity
                    style={{ width: CARD_WIDTH }}
                    className="bg-transparent border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-4 mb-4 items-center justify-center min-h-[180px]"
                    onPress={() => {
                        setEditingGoal(null);
                        setAddGoalVisible(true);
                    }}
                >
                    <View className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                        <Plus size={24} color={isDark ? "#9CA3AF" : "#64748B"} />
                    </View>
                    <Typography variant="body2" weight="medium" className="text-slate-500 dark:text-slate-400">
                        {t('addGoal')}
                    </Typography>
                </TouchableOpacity>
            );
        }

        const goal = item as Goal;
        const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
        const styles = getCategoryStyles(goal.category);

        const formatShort = (num: number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(num);
        };

        return (
            <View
                style={{ width: CARD_WIDTH }}
                className="bg-card rounded-3xl p-5 mb-4 border border-border shadow-sm min-h-[180px]"
            >
                <TouchableOpacity
                    onPress={() => {
                        setEditingGoal(goal);
                        setAddGoalVisible(true);
                    }}
                    className="flex-1 w-full"
                >
                    <View className="w-full h-full relative">
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                userId && deleteGoal(goal.id, userId);
                            }}
                            className="absolute right-0 top-0 z-50 p-2"
                        >
                            <Trash2 size={16} color={isDark ? '#94A3B8' : '#94A3B8'} />
                        </TouchableOpacity>
                        <View className="w-12 h-12 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'transparent' }}>
                            <View className={`absolute inset-0 rounded-full ${styles.bg}`} />
                            {styles.icon}
                        </View>

                        <Typography variant="body1" weight="bold" className="text-slate-900 dark:text-white mb-1" numberOfLines={1}>
                            {goal.title}
                        </Typography>

                        <Typography variant="caption" className="text-slate-500 dark:text-slate-400 mb-4">
                            {goal.category}
                        </Typography>

                        <View className="mt-auto">
                            <View className="flex-row justify-between items-end mb-2">
                                <Typography variant="body2" weight="bold" className="text-blue-600 dark:text-blue-400">
                                    {formatShort(goal.current_amount)}
                                </Typography>
                                <Typography variant="caption" className="text-slate-400 text-[10px]">
                                    Target {formatShort(goal.target_amount).replace('Rp ', '')}
                                </Typography>
                            </View>

                            {/* Progress Bar */}
                            <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </View>

                            <Typography variant="caption" className="text-[10px] text-slate-400 mt-1 text-right">
                                {progress.toFixed(0)}%
                            </Typography>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    // Tambahkan item "Add Goal" di akhir list
    const listData = [...displayGoals, { id: 'add-btn', isAddButton: true }];

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-center relative">
                <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-6">
                    <ArrowLeft size={24} color={isDark ? "#FFF" : "#0F172A"} />
                </TouchableOpacity>
                <Typography variant="h3" weight="bold" className="text-slate-900 dark:text-white">
                    {t('wishlist')}
                </Typography>
            </View>

            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                {/* Total Balance Section */}
                <View className="mb-6">
                    <View className="flex-row items-center mb-2">
                        <Lock size={16} color={isDark ? "#3B82F6" : "#2563EB"} />
                        <Typography variant="body2" weight="medium" className="text-blue-600 dark:text-blue-600 ml-2 uppercase tracking-wider">
                            {t('securedBalance')}
                        </Typography>
                    </View>
                    <Typography variant="h1" className="text-slate-900 dark:text-white text-4xl font-extrabold tracking-tight mb-6">
                        {formattedTotalLocked}
                    </Typography>

                    {/* Info Card */}
                    <View className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-5 flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/40 items-center justify-center mr-4">
                            <PiggyBank size={24} color={isDark ? "#60A5FA" : "#2563EB"} />
                        </View>
                        <View className="flex-1 mr-2">
                            <Typography variant="body2" weight="bold" className="text-slate-900 dark:text-white mb-1">
                                {t('totalSavingsLocked')}
                            </Typography>
                            <Typography variant="caption" className="text-slate-500 dark:text-slate-400 leading-tight">
                                {t('fundsSafeAndGrowing')}
                            </Typography>
                        </View>
                        <TouchableOpacity>
                            <Typography variant="body2" weight="bold" className="text-blue-600 dark:text-blue-400">
                                {t('details')}
                            </Typography>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Goals Grid */}
                {displayGoals.length === 0 ? (
                    <View className="items-center justify-center py-10">
                        <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                            <PiggyBank size={40} color={isDark ? "#9CA3AF" : "#64748B"} />
                        </View>
                        <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white mb-2">
                            {t('noGoalsYet')}
                        </Typography>
                        <Typography variant="body2" className="text-slate-500 text-center px-10">
                            {t('startSavingForDreams')}
                        </Typography>
                    </View>
                ) : null}

                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    scrollEnabled={false} // Di dalam ScrollView
                    renderItem={renderGoalCard as ListRenderItem<Goal | { id: string; isAddButton: boolean }>}
                />
            </ScrollView>

            {/* Floating Action Button */}
            <View className="absolute bottom-6 right-6">
                <TouchableOpacity
                    className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30"
                    onPress={() => {
                        setEditingGoal(null);
                        setAddGoalVisible(true);
                    }}
                >
                    <Plus size={28} color="white" />
                </TouchableOpacity>
            </View>

            <AddGoalModal
                visible={addGoalVisible}
                onClose={() => setAddGoalVisible(false)}
                goalToEdit={editingGoal ?? undefined}
            />
        </SafeAreaView>
    );
}
