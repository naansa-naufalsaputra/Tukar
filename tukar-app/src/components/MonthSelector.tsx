import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, addMonths, subMonths } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { useStoreV2 } from '../store/v2/useStoreV2';

export const MonthSelector = () => {
    const { selectedMonth, setSelectedMonth, currentTheme } = useStoreV2();
    const isDark = currentTheme === 'dark';

    const handlePrevMonth = () => {
        setSelectedMonth(subMonths(selectedMonth, 1));
    };

    const handleNextMonth = () => {
        setSelectedMonth(addMonths(selectedMonth, 1));
    };

    return (
        <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-3 mb-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <TouchableOpacity 
                onPress={handlePrevMonth}
                className="p-2 rounded-full bg-slate-50 dark:bg-slate-800"
            >
                <ChevronLeft size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
            
            <Text className="text-base font-bold text-slate-900 dark:text-white">
                {format(selectedMonth, 'MMMM yyyy', { locale: localeID })}
            </Text>
            
            <TouchableOpacity 
                onPress={handleNextMonth}
                className="p-2 rounded-full bg-slate-50 dark:bg-slate-800"
            >
                <ChevronRight size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
        </View>
    );
};
