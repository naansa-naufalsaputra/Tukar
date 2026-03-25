import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ghost, Inbox } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useStoreV2 } from '../../store/v2/useStoreV2';

interface AnimatedEmptyStateProps {
  message?: string;
  icon?: 'ghost' | 'inbox';
}

export const AnimatedEmptyState: React.FC<AnimatedEmptyStateProps> = ({
  message,
  icon = 'inbox'
}) => {
  const { t } = useTranslation();
  const defaultMessage = message || t('noDataYet');
  const currentTheme = useStoreV2((state) => state.currentTheme);
  const isDark = currentTheme === 'dark';

  const IconComponent = icon === 'ghost' ? Ghost : Inbox;
  const iconColor = isDark ? '#475569' : '#94a3b8'; // slate-600 / slate-400

  const translateY = useSharedValue(-10);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(10, { duration: 1500 }),
      -1, // infinite loop
      true // reverse
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View className="flex-1 items-center justify-center py-10">
      <Animated.View style={animatedIconStyle}>
        <IconComponent size={80} color={iconColor} strokeWidth={1.5} />
      </Animated.View>
      <Animated.View
        entering={FadeInDown.duration(800).delay(300)}
      >
        <Text className="text-slate-500 dark:text-slate-400 mt-6 font-medium text-center px-8">
          {defaultMessage}
        </Text>
      </Animated.View>
    </View>
  );
};
