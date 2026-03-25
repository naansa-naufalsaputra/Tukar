import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getIconComponent } from '@/utils/iconMap';
import { Typography } from '../Typography';

interface BudgetProgressCardProps {
    categoryName: string;
    iconName: string;
    colorHex: string;
    spentAmount: number;
    budgetLimit: number;
}

export function BudgetProgressCard({
    categoryName,
    iconName,
    colorHex,
    spentAmount,
    budgetLimit
}: BudgetProgressCardProps) {
    const { t } = useTranslation();
    const IconComponent = getIconComponent(iconName);

    // Kalkulasi persentase (Mencegah error pembagian dengan 0)
    const safeLimit = budgetLimit > 0 ? budgetLimit : 1;
    const percentage = (spentAmount / safeLimit) * 100;
    const isOverBudget = percentage > 100;

    // Batasi lebar bar maksimal 100% agar UI tidak jebol keluar layar
    const displayPercentage = Math.min(percentage, 100);

    // Format Rupiah
    const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    return (
        <View className="bg-card p-4 rounded-2xl border border-border mb-4 shadow-sm">
            {/* Header: Ikon, Nama, dan Persentase */}
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${colorHex}20` }}>
                        <IconComponent size={20} color={colorHex} />
                    </View>
                    <Typography variant="body1" weight="semibold">{categoryName}</Typography>
                </View>
                <Typography variant="h3" weight="bold" className={isOverBudget ? 'text-destructive' : 'text-primary'}>
                    {percentage.toFixed(0)}%
                </Typography>
            </View>

            {/* Progress Bar Track (Background Gelap) */}
            <View className="h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
                {/* Progress Bar Fill (Indikator Berjalan) */}
                <View
                    className={`h-full rounded-full ${isOverBudget ? 'bg-destructive' : ''}`}
                    style={{
                        width: `${displayPercentage}%`,
                        backgroundColor: isOverBudget ? undefined : colorHex
                    }}
                />
            </View>

            {/* Footer: Detail Nominal */}
            <View className="flex-row justify-between items-center mt-2">
                <Typography variant="caption">{formatRupiah(spentAmount)} {t('budgetUsed')}</Typography>
                <Typography variant="caption" weight="medium">{t('of')} {formatRupiah(budgetLimit)}</Typography>
            </View>

            {/* Peringatan Over Budget */}
            {isOverBudget && (
                <View className="mt-3 bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                    <Typography variant="caption" className="text-destructive text-center font-medium">
                        ⚠️ {t('budgetExceededWarning')}
                    </Typography>
                </View>
            )}
        </View>
    );
}
