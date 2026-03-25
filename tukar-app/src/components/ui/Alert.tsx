import React, { forwardRef } from 'react';
import { View, Text, TouchableOpacity, ViewProps, useColorScheme } from 'react-native';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react-native';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive';

export interface AlertProps extends ViewProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  destructive: 'bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800',
};

const titleStyles: Record<AlertVariant, string> = {
  info: 'text-blue-800 dark:text-blue-200',
  success: 'text-emerald-800 dark:text-emerald-200',
  warning: 'text-amber-800 dark:text-amber-200',
  destructive: 'text-rose-800 dark:text-rose-200',
};

const iconColors: Record<AlertVariant, string> = {
  info: '#3b82f6', // blue-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  destructive: '#e11d48', // rose-600
};
const iconColorsDark: Record<AlertVariant, string> = {
  info: '#60a5fa',      // blue-400
  success: '#34d399',   // emerald-400
  warning: '#fbbf24',   // amber-400
  destructive: '#fb7185', // rose-400
};

const Icons: Record<AlertVariant, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  destructive: XCircle,
};

export const Alert = forwardRef<View, AlertProps>(
  ({ variant = 'info', title, description, onDismiss, className, ...props }, ref) => {
    const colorScheme = useColorScheme();
    const Icon = Icons[variant];
    const iconColor = colorScheme === 'dark' ? iconColorsDark[variant] : iconColors[variant];

    return (
      <View
        ref={ref}
        className={cn(
          'border rounded-xl p-4 flex-row gap-3',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <Icon size={20} color={iconColor} className="mt-0.5" />
        
        <View className="flex-1">
          <Text className={cn('font-semibold text-base', titleStyles[variant])} style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
            {title}
          </Text>
          {description && (
            <Text className="text-sm text-muted-foreground mt-1 leading-5">
              {description}
            </Text>
          )}
        </View>

        {onDismiss && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onDismiss}
            className="p-1 -mr-2 -mt-2 h-8 w-8 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Dismiss alert"
          >
            <X size={18} color={iconColor} opacity={0.7} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

Alert.displayName = 'Alert';
