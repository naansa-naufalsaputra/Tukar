import React, { useState } from 'react';
import { View, Image, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

const sizeClasses = {
  xs: 'w-[24px] h-[24px]',
  sm: 'w-[32px] h-[32px]',
  md: 'w-[40px] h-[40px]',
  lg: 'w-[48px] h-[48px]',
  xl: 'w-[64px] h-[64px]',
};

const textClasses = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};

export interface AvatarProps extends ViewProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = React.forwardRef<React.ElementRef<typeof View>, AvatarProps>(
  ({ className, src, alt, size = 'md', ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const initials = alt ? alt.substring(0, 2).toUpperCase() : '';
    const showImage = src && !imageError;

    return (
      <View
        ref={ref}
        className={cn(
          'rounded-full overflow-hidden items-center justify-center bg-primary/10',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          <Image
            source={{ uri: src }}
            className="w-full h-full"
            onError={() => setImageError(true)}
            accessibilityLabel={alt}
          />
        ) : (
          <Text
            className={cn('text-primary', textClasses[size])}
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
          >
            {initials}
          </Text>
        )}
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';
export { Avatar };
