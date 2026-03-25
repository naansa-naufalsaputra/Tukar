import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { cn } from '@/lib/utils';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

const inputVariants = {
  default: 'bg-background dark:bg-background border-border dark:border-border',
  filled: 'bg-surface dark:bg-surface border-transparent dark:border-transparent',
  outline: 'bg-transparent border-border dark:border-border',
};

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      variant = 'default',
      className,
      inputClassName,
      labelClassName,
      errorClassName,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View className={cn('w-full', className)}>
        {label && (
          <Text
            className={cn(
              'mb-1.5 text-sm text-foreground dark:text-foreground',
              labelClassName
            )}
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
          >
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center h-12 px-4 rounded-xl border',
            inputVariants[variant],
            isFocused && 'border-primary dark:border-primary',
            error && 'border-destructive dark:border-destructive',
            inputClassName
          )}
        >
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className="flex-1 text-base text-foreground dark:text-foreground h-full"
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            placeholderTextColor="#9CA3AF"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text
            className={cn(
              'mt-1.5 text-xs text-destructive dark:text-destructive',
              errorClassName
            )}
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
