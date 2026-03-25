import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// 1. Ubah Pressable bawaan React Native menjadi komponen yang bisa dianimasikan
const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleTo = 0.95,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const content = React.Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? <Text>{child}</Text> : child
  );
  // 2. Buat state animasi di memori Native (Zero-Bridge)
  const scale = useSharedValue(1);

  // 3. Sambungkan state ke style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <ReanimatedPressable
      {...rest}
      // Gabungkan style animasi dengan style bawaan (jika ada)
      style={[animatedStyle, style ? StyleSheet.flatten(style) : undefined]}
      // Saat ditekan, mengecil jadi scaleTo (default 0.95)
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 10, stiffness: 200 });
        if (onPressIn) onPressIn(e);
      }}
      // Saat dilepas, kembali ke 100%
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        if (onPressOut) onPressOut(e);
      }}
    >
      {content}
    </ReanimatedPressable>
  );
};
