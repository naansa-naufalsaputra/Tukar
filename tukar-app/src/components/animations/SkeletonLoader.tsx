import React, { useEffect } from 'react';
import { ViewProps, DimensionValue, ViewStyle } from 'react-native';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface SkeletonLoaderProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string; // Dukungan untuk NativeWind
}

export const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  className,
  ...rest
}: SkeletonLoaderProps) => {
  const isDark = useStoreV2((state) => state.currentTheme === 'dark');
  // State untuk efek berkedip (Pulse)
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Membuat animasi looping tak terbatas (0.3 -> 0.7 -> 0.3)
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1, // -1 artinya infinite loop
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#334155' : '#e2e8f0',
        },
        animatedStyle,
        style as ViewStyle,
      ]}
      {...rest}
    />
  );
};
