import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'income' | 'expense' | 'pending' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-surface dark:bg-surface',
  income: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  expense: 'bg-rose-600/10 dark:bg-rose-600/20',
  pending: 'bg-amber-500/10 dark:bg-amber-500/20',
  success: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  warning: 'bg-amber-500/10 dark:bg-amber-500/20',
};

const textVariants = {
  default: 'text-foreground dark:text-foreground',
  income: 'text-emerald-500 dark:text-emerald-400',
  expense: 'text-rose-600 dark:text-rose-400',
  pending: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-500 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

const sizeVariants = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
  lg: 'px-3 py-1.5',
};

const textSizeVariants = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

const Badge = ({
  variant = 'default',
  size = 'md',
  className,
  textClassName,
  children,
  ...props
}: BadgeProps) => {
  return (
    <View
      className={cn(
        'flex-row items-center justify-center rounded-full',
        badgeVariants[variant],
        sizeVariants[size],
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          'text-center',
          textVariants[variant],
          textSizeVariants[size],
          textClassName
        )}
        style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
      >
        {children}
      </Text>
    </View>
  );
};

Badge.displayName = 'Badge';

export { Badge };
