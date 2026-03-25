import React, { useEffect, useCallback } from 'react';
import { View, Text, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export interface SuccessModalProps {
  visible: boolean;
  message?: string;
  onHide?: () => void;
  duration?: number;
}

export const SuccessModal = ({ visible, message, onHide, duration = 1500 }: SuccessModalProps) => {
  const { t } = useTranslation();
  const defaultMessage = message || t('transactionSavedSuccess');
  // State animasi di memori Native
  // State animasi di memori Native
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  const handleHide = useCallback(() => {
    onHide?.();
  }, [onHide]);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });

      if (handleHide) {
        const timer = setTimeout(handleHide, duration);
        return () => clearTimeout(timer);
      }
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, duration, handleHide]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-slate-950/80 px-6">
        <Animated.View
          style={animatedStyle}
          className="bg-slate-900 w-full max-w-sm p-8 rounded-3xl items-center border border-slate-800 shadow-xl shadow-black/50"
        >
          <View className="w-24 h-24 bg-emerald-500/20 rounded-full items-center justify-center mb-6">
            <CheckCircle size={48} color="#10b981" />
          </View>

          <Text className="text-white text-2xl font-bold mb-2 text-center">
            {t('successExclamation')}
          </Text>
          <Text className="text-slate-400 text-center text-base">
            {message || defaultMessage}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};
