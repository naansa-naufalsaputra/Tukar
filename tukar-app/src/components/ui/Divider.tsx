import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface DividerProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export function Divider({
  orientation = 'horizontal',
  className,
  label,
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <View
        className={cn('w-[1px] bg-border h-full', className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <View
        className={cn('flex-row items-center w-full', className)}
        {...props}
      >
        <View className="flex-1 h-[1px] bg-border" />
        <Text className="mx-4 text-sm text-muted-foreground font-['PlusJakartaSans_500Medium']">
          {label}
        </Text>
        <View className="flex-1 h-[1px] bg-border" />
      </View>
    );
  }

  return (
    <View
      className={cn('h-[1px] bg-border w-full', className)}
      {...props}
    />
  );
}
