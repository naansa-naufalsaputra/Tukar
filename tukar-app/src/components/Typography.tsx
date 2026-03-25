import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

interface TypographyProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
    color?: 'default' | 'primary' | 'muted' | 'destructive';
    className?: string;
    children?: React.ReactNode;
}

export function Typography({
    variant = 'body1',
    weight = 'normal',
    color = 'default',
    className = '',
    style,
    children,
    ...props
}: TypographyProps) {
    let baseClass = '';

    // Color
    switch (color) {
        case 'primary': baseClass += 'text-primary '; break;
        case 'muted': baseClass += 'text-muted-foreground '; break;
        case 'destructive': baseClass += 'text-destructive '; break;
        case 'default':
        default:
            baseClass += variant === 'caption' ? 'text-muted-foreground ' : 'text-foreground ';
            break;
    }

    // Variant
    switch (variant) {
        case 'h1': baseClass += 'text-4xl tracking-tight '; break;
        case 'h2': baseClass += 'text-3xl tracking-tight '; break;
        case 'h3': baseClass += 'text-2xl tracking-tight '; break;
        case 'h4': baseClass += 'text-xl tracking-tight '; break;
        case 'body1': baseClass += 'text-base '; break;
        case 'body2': baseClass += 'text-sm '; break;
        case 'caption': baseClass += 'text-xs '; break;
    }

    // Weight & Font Family
    let fontFamilyStyle: TextStyle['fontFamily'] = 'PlusJakartaSans_400Regular';
    switch (weight) {
        case 'normal':
            baseClass += 'font-sans ';
            fontFamilyStyle = 'PlusJakartaSans_400Regular';
            break;
        case 'medium':
            baseClass += 'font-medium ';
            fontFamilyStyle = 'PlusJakartaSans_500Medium';
            break;
        case 'semibold':
            baseClass += 'font-semibold ';
            fontFamilyStyle = 'PlusJakartaSans_600SemiBold';
            break;
        case 'bold':
            baseClass += 'font-bold ';
            fontFamilyStyle = 'PlusJakartaSans_700Bold';
            break;
    }

    return (
        <Text
            className={`${baseClass} ${className}`}
            style={[{ fontFamily: fontFamilyStyle }, style]}
            {...props}
        >
            {children}
        </Text>
    );
}
