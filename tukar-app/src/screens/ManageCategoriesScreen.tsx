import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { Category, RootStackParamList } from '@/types';
import * as Icons from 'lucide-react-native';

import { useTranslation } from 'react-i18next';

type ManageCategoriesScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ManageCategoriesScreen'>;
};

export default function ManageCategoriesScreen({ navigation }: ManageCategoriesScreenProps) {
    const { t } = useTranslation();
    const { categories, deleteCategory } = useStoreV2();
    const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const filteredCategories = categories.filter(
        (c: Category) => c.type && c.type.toUpperCase() === activeTab.toUpperCase()
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="flex-row items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icons.ArrowLeft size={24} className="text-slate-900 dark:text-white" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">{t('categories')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddCategoryScreen')}>
                    <Icons.Plus size={24} color="#136dec" />
                </TouchableOpacity>
            </View>

            <View className="px-6 py-4">
                <View className="flex-row p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                    <TouchableOpacity onPress={() => setActiveTab('EXPENSE')} className={`flex-1 py-2 rounded-lg ${activeTab === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>
                        <Text className={`text-center font-semibold ${activeTab === 'EXPENSE' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{t('expense')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('INCOME')} className={`flex-1 py-2 rounded-lg ${activeTab === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>
                        <Text className={`text-center font-semibold ${activeTab === 'INCOME' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{t('income')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-6">
                <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 mt-2">{t('mainCategories')}</Text>

                <View className="flex-row flex-wrap gap-4 justify-between">
                    {filteredCategories.map((item: Category) => {
                        const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[item.icon_name] || Icons.HelpCircle;
                        const hasBudget = item.type === 'EXPENSE' && typeof item.budget_limit === 'number' && item.budget_limit > 0;

                        return (
                            <View key={item.id} className="w-[30%] items-center mb-6 relative">
                                <TouchableOpacity onPress={() => userId && deleteCategory(item.id, userId)} className="absolute -top-1 -right-1 bg-slate-200 dark:bg-slate-700 rounded-full p-1 z-10">
                                    <Icons.X size={10} color="#64748b" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => navigation.navigate('AddCategoryScreen', { category: item })}>
                                    <View className="w-16 h-16 rounded-full items-center justify-center mb-2" style={{ backgroundColor: (item.color_hex || '#cccccc') + '20' }}>
                                        <IconComponent size={28} color={item.color_hex || '#cccccc'} />
                                    </View>
                                </TouchableOpacity>
                                <Text className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">{item.name}</Text>

                                <View className={`bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-1 self-center ${hasBudget ? 'flex' : 'hidden'}`}>
                                    <Text className="text-[10px] text-slate-500 font-bold">
                                        {hasBudget ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.budget_limit as number) : '0'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View className={`w-full items-center mt-10 ${filteredCategories.length === 0 ? 'flex' : 'hidden'}`}>
                    <Text className="text-slate-400 text-sm">{t('noCategoriesYet')} {activeTab === 'INCOME' ? t('income') : t('expense')}.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
