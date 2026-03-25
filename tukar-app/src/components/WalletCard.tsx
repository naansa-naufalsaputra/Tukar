import { MotiView } from 'moti';
import React from 'react';
import { View } from 'react-native';
import { CreditCard, Banknote } from 'lucide-react-native';
import { Typography } from './Typography';
import { Wallet } from '../types';

interface WalletCardProps {
    wallet: Wallet;
    index?: number;
}

export function WalletCard({ wallet, index = 0 }: WalletCardProps) {
    const isBlue = wallet.wallet_type === 'KARTU';

    // Tailwind v4 Dynamic Classes handling using utility groups defined in tailwind.config.js
    const containerClass = isBlue
        ? 'bg-wallet-blue-bg dark:bg-wallet-blue-darkBg'
        : 'bg-wallet-orange-bg dark:bg-wallet-orange-darkBg';

    const textClass = isBlue
        ? 'text-wallet-blue-text dark:text-blue-200'
        : 'text-wallet-orange-text dark:text-orange-200';

    const Icon = isBlue ? CreditCard : Banknote;

    // Format IDR currency
    const formattedBalance = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(wallet.balance);

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                type: 'spring',
                damping: 15,
                stiffness: 150,
                delay: index * 150, // Stagger effect
            }}
            className={`flex-1 rounded-2xl p-4 ${containerClass}`}
        >
            <View className="flex-row items-center mb-4">
                <Icon
                    size={20}
                    className={textClass}
                    color={isBlue ? '#2563EB' : '#EA580C'}
                    accessibilityLabel={`${wallet.name} wallet icon`}
                />
                <Typography variant="body2" weight="medium" className={`ml-2 ${textClass}`}>
                    {wallet.name}
                </Typography>
            </View>
            <Typography variant="h4" weight="bold" className={`mt-auto ${textClass}`}>
                {formattedBalance}
            </Typography>
        </MotiView>
    );
}
