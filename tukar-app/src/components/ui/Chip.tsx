import React, { forwardRef, ReactNode } from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, View } from 'react-native';
import { cn } from '@/lib/utils';

export interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Chip = forwardRef<View, ChipProps>(
  (
    {
      label,
      selected = false,
      onPress,
      icon,
      disabled = false,
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        className={cn(
          'flex-row items-center justify-center rounded-full border',
          size === 'sm' ? 'px-3 py-1' : 'px-4 py-2',
          selected
            ? 'bg-primary border-primary'
            : 'bg-surface border-border',
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {icon && (
          <View className={cn('mr-1.5', size === 'sm' ? 'scale-75' : '')}>
            {icon}
          </View>
        )}
        <Text
          className={cn(
            'font-medium',
            size === 'sm' ? 'text-xs' : 'text-sm',
            selected ? 'text-primary-foreground' : 'text-foreground'
          )}
          style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);

Chip.displayName = 'Chip';
