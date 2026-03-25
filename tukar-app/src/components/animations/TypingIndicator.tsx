import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  dotColor?: string;
  dotSize?: number;
}

const Dot = ({ index, color, size }: { index: number, color: string, size: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    const delay = index * 150;

    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-6, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    ));

    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.5, { duration: 400 })
      ),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, width: size, height: size },
        animatedStyle
      ]}
    />
  );
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  dotColor = '#3b82f6',
  dotSize = 6,
}) => {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map((index) => (
        <Dot key={index} index={index} color={dotColor} size={dotSize} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    gap: 4,
    paddingHorizontal: 8,
  },
  dot: {
    borderRadius: 999,
  },
});
