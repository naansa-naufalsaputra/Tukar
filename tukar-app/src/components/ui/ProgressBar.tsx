import React, { forwardRef, useEffect, useRef } from 'react';
import { View, Text, Animated, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends ViewProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantColors = {
  default: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#E11D48',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export const ProgressBar = forwardRef<View, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      label,
      showValue = false,
      variant = 'default',
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, [percentage, animatedValue]);

    const width = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View ref={ref} className={cn('w-full', className)} {...props}>
        {(label || showValue) && (
          <View className="flex-row justify-between items-center mb-1.5">
            {label ? (
              <Text className="text-sm text-foreground font-['PlusJakartaSans_500Medium']">
                {label}
              </Text>
            ) : (
              <View />
            )}
            {showValue && (
              <Text className="text-sm text-foreground font-['PlusJakartaSans_600SemiBold']">
                {Math.round(percentage)}%
              </Text>
            )}
          </View>
        )}
        <View
          className={cn(
            'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
            sizeClasses[size]
          )}
        >
          <Animated.View
            style={{ width, backgroundColor: variantColors[variant] }}
            className="h-full rounded-full"
          />
        </View>
      </View>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
