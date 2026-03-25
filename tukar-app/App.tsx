import { MotiView, MotiSafeAreaView } from 'moti';
import * as Sentry from "@sentry/react-native";
import "./global.css";
import '@/lib/i18n';
import React, { useEffect } from 'react';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { StatusBar, LogBox, AppState, AppStateStatus, View } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { useStoreV2 } from './src/store/v2/useStoreV2';
import { useColorScheme, colorScheme } from 'nativewind';
import * as LocalAuthentication from 'expo-local-authentication';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Logger } from '@/lib/logger';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold
} from '@expo-google-fonts/plus-jakarta-sans';

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// Membungkam semua console.log, warn, dan error di Production
Sentry.init({
    dsn: "YOUR_SENTRY_DSN", // Ganti dengan DSN asli Anda nanti
    debug: __DEV__,
    enableNativeFramesTracking: true,
});

if (!__DEV__) {
    console.log = () => { };
    console.warn = () => { };
    console.error = () => { };
}

const toastConfig: ToastConfig = {
    success: (props) => (
        <BaseToast
            {...props}
            style={{
                borderLeftColor: '#10b981',
                backgroundColor: colorScheme.get() === 'dark' ? '#1e293b' : '#ffffff',
                borderRadius: 12,
                marginTop: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
            }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colorScheme.get() === 'dark' ? '#f8fafc' : '#0f172a',
            }}
            text2Style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colorScheme.get() === 'dark' ? '#94a3b8' : '#64748b',
            }}
        />
    ),
    error: (props) => (
        <ErrorToast
            {...props}
            style={{
                borderLeftColor: '#ef4444',
                backgroundColor: colorScheme.get() === 'dark' ? '#1e293b' : '#ffffff',
                borderRadius: 12,
                marginTop: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
            }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colorScheme.get() === 'dark' ? '#f8fafc' : '#0f172a',
            }}
            text2Style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colorScheme.get() === 'dark' ? '#94a3b8' : '#64748b',
            }}
        />
    ),
    info: (props) => (
        <BaseToast
            {...props}
            style={{
                borderLeftColor: '#3b82f6',
                backgroundColor: colorScheme.get() === 'dark' ? '#1e293b' : '#ffffff',
                borderRadius: 12,
                marginTop: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
            }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colorScheme.get() === 'dark' ? '#f8fafc' : '#0f172a',
            }}
            text2Style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colorScheme.get() === 'dark' ? '#94a3b8' : '#64748b',
            }}
        />
    ),
};

export default Sentry.wrap(function App() {
    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
    });

    const currentTheme = useStoreV2((state: any) => state.currentTheme);
    const biometricEnabled = useStoreV2((state: any) => state.biometricEnabled);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isAuthenticating, setIsAuthenticating] = React.useState(false);
    const { colorScheme: nwColorScheme, setColorScheme } = useColorScheme();
    const isDark = nwColorScheme === 'dark';

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    const handleBiometricAuth = React.useCallback(async () => {
        if (!biometricEnabled || isAuthenticated || isAuthenticating) return;

        try {
            setIsAuthenticating(true);
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Autentikasi diperlukan',
                    fallbackLabel: 'Gunakan PIN',
                    disableDeviceFallback: false,
                });

                if (result.success) {
                    setIsAuthenticated(true);
                }
            } else {
                setIsAuthenticated(true); // Let it pass if no hardware
            }
        } catch (error) {
            Logger.error('Biometric error', error);
            setIsAuthenticated(true);
        } finally {
            setIsAuthenticating(false);
        }
    }, [biometricEnabled, isAuthenticated, isAuthenticating]);

    useEffect(() => {
        if (nwColorScheme !== currentTheme) {
            setColorScheme(currentTheme);
        }
    }, [currentTheme, nwColorScheme, setColorScheme]);

    useEffect(() => {
        if (biometricEnabled && !isAuthenticated && !isAuthenticating) {
            handleBiometricAuth();
        } else if (!biometricEnabled) {
            setIsAuthenticated(true);
        }
    }, [biometricEnabled, isAuthenticated, isAuthenticating, handleBiometricAuth]);

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                if (biometricEnabled) {
                    setIsAuthenticated(false);
                }
            } else if (nextAppState === 'active') {
                if (biometricEnabled && !isAuthenticated && !isAuthenticating) {
                    handleBiometricAuth();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove();
        };
    }, [biometricEnabled, isAuthenticated, isAuthenticating, handleBiometricAuth]);

    if (!fontsLoaded || (biometricEnabled && !isAuthenticated)) {
        return (
            <SafeAreaProvider>
                <View className="flex-1 bg-background">
                    <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <MotiView
            key={currentTheme}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ flex: 1 }}
        >
            <SafeAreaProvider>
                <ErrorBoundary>
                    <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                    <View className="flex-1 bg-background">
                        <RootNavigator />
                    </View>
                </ErrorBoundary>
                <Toast config={toastConfig} />
            </SafeAreaProvider>
        </MotiView>
    );
});