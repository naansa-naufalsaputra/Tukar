import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Icons from 'lucide-react-native';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { CategoryType, Category, RootStackParamList } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

const AVAILABLE_ICONS = ['Utensils', 'Coffee', 'Pizza', 'Car', 'ShoppingBag', 'Gamepad2', 'Wallet', 'Home', 'HeartPulse', 'Briefcase', 'Star', 'MoreHorizontal'];
const AVAILABLE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#0ea5e9', '#ec4899'];
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { supabase } from '@/lib/supabase';
type AddCategoryScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AddCategoryScreen'>;
    route: RouteProp<RootStackParamList, 'AddCategoryScreen'>;
};

export default function AddCategoryScreen({ navigation, route }: AddCategoryScreenProps) {
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const addCategory = useStoreV2((state) => state.addCategory);
    const updateCategory = useStoreV2((state) => state.updateCategory);
    const defaultType = (route.params?.type || 'EXPENSE') as CategoryType;
    const categoryToEdit = route.params?.category as Category | undefined;

    const [name, setName] = useState(categoryToEdit?.name || '');
    const [budgetLimit, setBudgetLimit] = useState(categoryToEdit?.budget_limit ? String(categoryToEdit.budget_limit) : '');
    const [type, setType] = useState(categoryToEdit?.type || defaultType);
    const [selectedIcon, setSelectedIcon] = useState(categoryToEdit?.icon_name || 'MoreHorizontal');
    const [selectedColor, setSelectedColor] = useState(categoryToEdit?.color_hex || '#0ea5e9');

    const [userId, setUserId] = useState<string | null>(null);

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);

    const handleSave = async () => {
        if (!name.trim()) return Alert.alert(t('oops'), t('categoryNameCannotBeEmpty'));
        if (!userId) return Alert.alert(t('oops'), t('invalidUserSession'));
        const numBudget = budgetLimit ? Number(budgetLimit.replace(/[^0-9]/g, '')) : 0;

        try {
            if (categoryToEdit) {
                await updateCategory(userId, categoryToEdit.id, { name, type, icon_name: selectedIcon, color_hex: selectedColor, budget_limit: numBudget });
            } else {
                await addCategory(userId, { name, type, icon_name: selectedIcon, color_hex: selectedColor, budget_limit: numBudget });
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('failed'), t('errorOccurred'));
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
            <View className="flex-row items-center justify-between px-6 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2"><Icons.ArrowLeft size={24} color={colorScheme === 'dark' ? '#f8fafc' : '#0f172a'} /></TouchableOpacity>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">{categoryToEdit ? t('editCategory') : t('newCategory')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <View className="flex-row p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6">
                    <TouchableOpacity onPress={() => setType('EXPENSE')} className={`flex-1 py-2 items-center rounded-lg ${type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>
                        <Text className={`font-bold text-sm ${type === 'EXPENSE' ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>{t('expense')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setType('INCOME')} className={`flex-1 py-2 items-center rounded-lg ${type === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>
                        <Text className={`font-bold text-sm ${type === 'INCOME' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>{t('income')}</Text>
                    </TouchableOpacity>
                </View>

                <View className="mb-6">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-widest">{t('categoryName')}</Text>
                    <TextInput className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-medium" placeholder={t('exampleCategory')} placeholderTextColor={colorScheme === 'dark' ? '#475569' : '#94a3b8'} value={name} onChangeText={setName} />
                </View>

                {/* Gunakan class 'hidden' jika bukan expense, jangan dicopot dari DOM! */}
                <View className={`mb-6 ${type === 'EXPENSE' ? 'flex' : 'hidden'}`}>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-2 tracking-widest">{t('budgetLimitOptional')}</Text>
                    <View className="flex-row items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4">
                        <Text className="text-slate-500 dark:text-slate-400 font-bold mr-2">Rp</Text>
                        <TextInput className="flex-1 text-slate-900 dark:text-white py-4 font-medium" placeholder="500000" placeholderTextColor={colorScheme === 'dark' ? '#475569' : '#94a3b8'} keyboardType="numeric" value={budgetLimit} onChangeText={setBudgetLimit} />
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-widest">{t('chooseColor')}</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {AVAILABLE_COLORS.map(color => (
                            <TouchableOpacity key={color} onPress={() => setSelectedColor(color)} className={`w-10 h-10 rounded-full items-center justify-center border-2 ${selectedColor === color ? 'border-slate-900 dark:border-slate-200' : 'border-transparent'}`} style={{ backgroundColor: color }}>
                                {selectedColor === color && <Icons.Check size={16} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mb-10">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-widest">{t('chooseIcon')}</Text>
                    <View className="flex-row flex-wrap gap-4">
                        {AVAILABLE_ICONS.map(iconName => {
                            const IconComponent = (Icons as unknown as Record<string, React.ComponentType<any>>)[iconName] || Icons.CircleDashed;
                            return (
                                <TouchableOpacity key={iconName} onPress={() => setSelectedIcon(iconName)} className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${selectedIcon === iconName ? 'border-slate-900 dark:border-slate-200 bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                                    <IconComponent size={24} color={selectedIcon === iconName ? selectedColor : '#64748b'} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <View className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <TouchableOpacity onPress={handleSave} className="p-4 rounded-xl items-center bg-blue-600">
                    <Text className="text-white font-bold text-lg">{t('save')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}