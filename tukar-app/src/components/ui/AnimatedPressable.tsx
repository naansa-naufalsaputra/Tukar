import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleValue?: number;
  opacityValue?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const AnimatedPressable = React.forwardRef<React.ElementRef<typeof Pressable>, AnimatedPressableProps>(
  (
    {
      children,
      scaleValue = 0.95,
      opacityValue = 0.8,
      style,
      className,
      onPressIn,
      onPressOut,
      disabled,
      ...props
    },
    ref
  ) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
      };
    });

    const handlePressIn = (e: any) => {
      if (!disabled) {
        scale.value = withSpring(scaleValue, {
          damping: 15,
          stiffness: 300,
          mass: 0.5,
        });
        opacity.value = withTiming(opacityValue, { duration: 100 });
      }
      if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
      if (!disabled) {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
          mass: 0.5,
        });
        opacity.value = withTiming(1, { duration: 150 });
      }
      if (onPressOut) onPressOut(e);
    };

    return (
      <Animated.View style={[animatedStyle, style]} className={className}>
        <Pressable
          ref={ref}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          {...props}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }
);

AnimatedPressable.displayName = 'AnimatedPressable';

export { AnimatedPressable };
