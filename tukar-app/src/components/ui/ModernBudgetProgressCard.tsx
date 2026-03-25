import React from 'react';
import { View } from 'react-native';
import { Typography } from '../Typography';

interface BudgetData {
    category: string;
    spent: number;
    budgeted: number;
}

interface ModernBudgetProgressCardProps {
    data: BudgetData;
    colorHex?: string; // Optional custom color, otherwise derives from percentage
}

export function ModernBudgetProgressCard({ data, colorHex = '#3B82F6' }: ModernBudgetProgressCardProps) {
    const { category, spent, budgeted } = data;

    // Safe calculation to avoid division by zero
    const safeBudgeted = budgeted > 0 ? budgeted : 1;
    const rawPercentage = (spent / safeBudgeted) * 100;

    // Cap at 100 for the bar width
    const progressWidth = Math.min(rawPercentage, 100);
    const isOverBudget = spent > budgeted;

    // Formatting currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <View className="bg-white/10 p-5 rounded-3xl mb-4 border border-white/20 shadow-lg overflow-hidden backdrop-blur-lg">
            <View className="flex-row justify-between items-end mb-4">
                <View>
                    <Typography variant="body2" className="text-white/70 tracking-wide uppercase font-semibold mb-1">
                        {category}
                    </Typography>
                    <Typography variant="h3" weight="bold" className="text-white">
                        {formatCurrency(spent)}
                    </Typography>
                </View>

                <View className="items-end">
                    <Typography variant="caption" className="text-white/60 mb-1">
                        of {formatCurrency(budgeted)}
                    </Typography>
                    <Typography
                        variant="h4"
                        weight="bold"
                        className={isOverBudget ? "text-rose-400" : "text-emerald-400"}
                    >
                        {rawPercentage.toFixed(1)}%
                    </Typography>
                </View>
            </View>

            {/* Progress Track */}
            <View className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                {/* Progress Fill */}
                <View
                    className="h-full rounded-full"
                    style={{
                        width: `${progressWidth}%`,
                        backgroundColor: isOverBudget ? '#f43f5e' : colorHex // rose-500 if over budget
                    }}
                />
            </View>

            {isOverBudget && (
                <Typography variant="caption" className="text-rose-400 mt-3 font-medium">
                    Budget exceeded by {formatCurrency(spent - budgeted)}
                </Typography>
            )}
        </View>
    );
}
