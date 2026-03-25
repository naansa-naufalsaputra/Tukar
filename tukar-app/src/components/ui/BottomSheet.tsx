import React, { useEffect, useRef, useState } from 'react';
import { Modal, Animated, TouchableOpacity, View, Text, TouchableWithoutFeedback } from 'react-native';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  snapPoint?: number;
  className?: string;
  contentClassName?: string;
}

export const BottomSheet = ({
  visible,
  onClose,
  children,
  title,
  snapPoint,
  contentClassName,
  className,
}: BottomSheetProps) => {
  const [showModal, setShowModal] = useState(visible);
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, translateY]);

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent={true}
      statusBarTranslucent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0 bg-black/50" />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            { transform: [{ translateY }] },
            snapPoint ? { height: snapPoint } : undefined
          ]}
          className={cn(
            "bg-surface rounded-t-3xl w-full overflow-hidden",
            !snapPoint && "max-h-[90%]",
            className
          )}
        >
          <View className="w-10 h-1 bg-border rounded-full self-center mt-3 mb-2" />
          
          {title && (
            <View className="px-4 pb-3 border-b border-border">
              <Text className="text-foreground font-semibold text-lg text-center">
                {title}
              </Text>
            </View>
          )}
          
          <View className={cn('pb-8', contentClassName)}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

BottomSheet.displayName = 'BottomSheet';
