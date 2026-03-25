import React from 'react';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { cn } from '@/lib/utils';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  textClassName?: string;
}

const buttonVariants = {
  default: 'bg-primary',
  secondary: 'bg-secondary',
  destructive: 'bg-destructive',
  outline: 'border border-border bg-transparent',
  ghost: 'bg-transparent',
};

const textVariants = {
  default: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  destructive: 'text-destructive-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
};

const sizeVariants = {
  sm: 'h-9 px-3 rounded-md',
  md: 'h-10 px-4 py-2 rounded-md',
  lg: 'h-11 px-8 rounded-md',
  icon: 'h-10 w-10 items-center justify-center rounded-md',
};

const textSizeVariants = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  icon: 'text-sm',
};

const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const handlePress = (event: any) => {
      if (props.onPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress(event);
      }
    };

    return (
      <AnimatedPressable
        ref={ref as any}
        disabled={isDisabled}
        className={cn(
          'flex-row items-center justify-center',
          buttonVariants[variant],
          sizeVariants[size],
          isDisabled && 'opacity-50',
          className
        )}
        {...props}
        onPress={handlePress}
      >
        {loading && (
          <ActivityIndicator
            size="small"
            className={cn('mr-2', !children && 'mr-0')}
          />
        )}
        {!loading && icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
        {children && (
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
        )}
        {!loading && icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
      </AnimatedPressable>
    );
  }
);

Button.displayName = 'Button';

export { Button };
