import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface ActionSheetItem {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'destructive';
  destructive?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
  className?: string;
  cancelLabel?: string;
}

export const ActionSheet = ({
  visible,
  onClose,
  title,
  items,
  className,
  cancelLabel,
}: ActionSheetProps) => {
  const { t } = useTranslation();
  const defaultCancelLabel = cancelLabel || t('cancel');

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      className={className}
    >
      <View className="pt-2">
        {items.map((item, index) => {
          const isDestructive = item.variant === 'destructive' || item.destructive;
          const isLast = index === items.length - 1;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                item.onPress();
                onClose();
              }}
              className={cn(
                "flex-row items-center px-4 py-3.5 gap-3",
                !isLast && "border-b border-border"
              )}
            >
              {item.icon && <View>{item.icon}</View>}
              <Text
                className={cn(
                  "font-medium text-base",
                  isDestructive ? "text-destructive" : "text-foreground"
                )}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onClose}
        className="mt-2 mb-4 mx-4 py-3 rounded-xl bg-surface border border-border items-center"
      >
        <Text className="text-foreground font-semibold text-base">
          {defaultCancelLabel}
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
};

ActionSheet.displayName = 'ActionSheet';
