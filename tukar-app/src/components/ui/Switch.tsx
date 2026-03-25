import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Animated, TouchableOpacityProps, useColorScheme } from 'react-native';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<TouchableOpacityProps, 'onPress' | 'value'> {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

const Switch = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, SwitchProps>(
  ({ className, value, onValueChange, label, disabled = false, activeColor = '#10B981', inactiveColor, ...props }, ref) => {
    const colorScheme = useColorScheme();
    const resolvedInactiveColor = inactiveColor ?? (colorScheme === 'dark' ? '#475569' : '#D1D5DB');
    const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;

    useEffect(() => {
      Animated.spring(translateX, {
        toValue: value ? 22 : 2,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }, [value, translateX]);

    const toggleSwitch = () => {
      if (!disabled) {
        onValueChange(!value);
      }
    };

    const switchElement = (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.8}
        onPress={toggleSwitch}
        disabled={disabled}
        className={cn(
          'w-[44px] h-[24px] rounded-full justify-center',
          disabled && 'opacity-50',
          !label && className
        )}
        style={{ backgroundColor: value ? activeColor : resolvedInactiveColor }}
        {...props}
      >
        <Animated.View
          className="w-[20px] h-[20px] rounded-full bg-white shadow-sm"
          style={{ transform: [{ translateX }] }}
        />
      </TouchableOpacity>
    );

    if (label) {
      return (
        <View className={cn('flex-row justify-between items-center', className)}>
          <Text
            className="text-base text-foreground"
            style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
          >
            {label}
          </Text>
          {switchElement}
        </View>
      );
    }

    return switchElement;
  }
);

Switch.displayName = 'Switch';
export { Switch };
