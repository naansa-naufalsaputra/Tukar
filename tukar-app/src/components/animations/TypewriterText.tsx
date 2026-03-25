import React, { useState, useEffect, useCallback } from 'react';
import { Text, TextProps } from 'react-native';

interface TypewriterTextProps extends TextProps {
  text: string;
  typingSpeed?: number;
  onComplete?: () => void;
  enabled?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  typingSpeed = 10,
  onComplete,
  enabled = true,
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      handleComplete();
    }
  }, [currentIndex, enabled, text, typingSpeed, handleComplete]);

  return <Text {...props}>{displayedText}</Text>;
};
