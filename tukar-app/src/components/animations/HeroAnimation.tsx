import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

export default function HeroAnimation() {
  const floatY = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Animasi melayang yang sangat smooth
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );

    // Animasi denyut AI yang elegan
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  const pulseProps = useAnimatedProps(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={floatStyle} className="items-center justify-center my-8">
      <Svg width="200" height="200" viewBox="0 0 100 100">
        <Defs>
          {/* Gradien Cosmic Night */}
          <LinearGradient id="cosmicGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#0ea5e9" stopOpacity="1" />
            <Stop offset="1" stopColor="#06b6d4" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Cincin Orbit Minimalis */}
        <Circle cx="50" cy="50" r="42" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity="0.5" />
        <Circle cx="50" cy="50" r="30" stroke="#94a3b8" strokeWidth="0.5" fill="none" opacity="0.3" />

        {/* Bintang AI (Spark) */}
        <AnimatedG animatedProps={pulseProps}>
          <Path
            d="M50 15 C50 35 35 50 15 50 C35 50 50 65 50 85 C50 65 65 50 85 50 C65 50 50 35 50 15 Z"
            fill="url(#cosmicGrad)"
          />
          <Circle cx="50" cy="50" r="6" fill="#ffffff" opacity="0.9" />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
