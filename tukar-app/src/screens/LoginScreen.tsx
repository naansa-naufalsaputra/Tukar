import React, { useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { Logger } from '../lib/logger';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowRightLeft } from 'lucide-react-native';
import { Typography } from '../components/Typography';
import { supabase } from '../lib/supabase';
import { useStoreV2 } from '../store/v2/useStoreV2';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type LoginScreenProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'LoginScreen'> };
export default function LoginScreen({ navigation }: LoginScreenProps) {
    const { currentTheme } = useStoreV2();
    const isDark = currentTheme === 'dark';
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('warning'), t('fillEmailPassword'));
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert(t('loginFailed'), error.message);
        }
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            const redirectTo = makeRedirectUri();
            Logger.info('GoogleAuth', `Redirect URI: ${redirectTo}`);
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
                if (res.type === 'success') {
                    const { url } = res;
                    const params = new URLSearchParams(url.split('#')[1]);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        await supabase.auth.setSession({
                            access_token,
                            refresh_token
                        });
                        Alert.alert(t('success'), t('googleLoginSuccess'));
                    }
                }
            }
        } catch (error) {
            Alert.alert(t('googleLoginFailed'), error instanceof Error ? error.message : String(error));
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#ffffff] dark:bg-[#121212]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>

                    {/* Header / Logo Area */}
                    <View className="pb-8 pt-12 items-center justify-center">
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-[#136dec]/10 dark:bg-white/5">
                            <ArrowRightLeft size={32} color={isDark ? "#3b82f6" : "#136dec"} />
                        </View>
                        <Typography variant="h1" className="text-[36px] font-extrabold text-slate-900 dark:text-slate-100 text-center leading-tight tracking-tight">
                            Tukar
                        </Typography>
                        <Typography variant="body2" weight="medium" className="mt-2 text-center text-slate-500 dark:text-gray-400">
                            {t('welcomeSubtitle')}
                        </Typography>
                    </View>

                    {/* Form Area */}
                    <View className="space-y-5 w-full">
                        {/* Email Input */}
                        <View>
                            <Typography variant="body2" weight="bold" className="pb-2 ml-1 text-slate-900 dark:text-white">
                                {t('emailLabel')}
                            </Typography>
                            <View className="flex-row items-center bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333333] rounded-xl px-4 h-14">
                                <Mail size={20} color={isDark ? "#9ca3af" : "#94a3b8"} className="mr-3" />
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t('emailLabel')}
                                    placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 text-base text-slate-900 dark:text-white h-full"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View>
                            <Typography variant="body2" weight="bold" className="pb-2 ml-1 text-slate-900 dark:text-white">
                                {t('passwordLabel')}
                            </Typography>
                            <View className="flex-row items-center bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333333] rounded-xl px-4 h-14">
                                <Lock size={20} color={isDark ? "#9ca3af" : "#94a3b8"} className="mr-3" />
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder={t('passwordLabel')}
                                    placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                                    secureTextEntry={!showPassword}
                                    className="flex-1 text-base text-slate-900 dark:text-white h-full"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                                    {showPassword ? (
                                        <EyeOff size={20} color={isDark ? "#9ca3af" : "#94a3b8"} />
                                    ) : (
                                        <Eye size={20} color={isDark ? "#9ca3af" : "#94a3b8"} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <View className="flex-row justify-end pt-2">
                                <TouchableOpacity>
                                    <Typography variant="body2" weight="medium" className="text-slate-500 dark:text-[#60a5fa]">
                                        {t('forgotPassword')}
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-8 flex-col gap-4">
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            className={`h-14 rounded-xl items-center justify-center flex-row shadow-lg ${isLoading
                                ? 'bg-[#136dec]/50 dark:bg-[#3b82f6]/50'
                                : 'bg-[#136dec] dark:bg-[#3b82f6] shadow-[#136dec]/30 dark:shadow-blue-900/20'
                                }`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Typography variant="body1" weight="bold" className="text-white tracking-wide">
                                    {t('loginTitle')}
                                </Typography>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row items-center my-2">
                            <View className="flex-1 h-[1px] bg-slate-200 dark:bg-[#333333]" />
                            <Typography variant="body2" className="mx-4 text-slate-400">{t('orDivider')}</Typography>
                            <View className="flex-1 h-[1px] bg-slate-200 dark:bg-[#333333]" />
                        </View>

                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            className="h-14 flex-row items-center justify-center bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-[#333333] shadow-sm"
                        >
                            <Typography variant="h3" weight="bold" className="text-slate-800 dark:text-white mr-3">G</Typography>
                            <Typography variant="body1" weight="bold" className="text-slate-800 dark:text-white">{t('continueWithGoogle')}</Typography>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="mt-auto pt-8 pb-4 flex-row items-center justify-center">
                        <Typography variant="body2" weight="medium" className="text-slate-500 dark:text-gray-400 text-center">
                            {t('noAccountYet')}{' '}
                        </Typography>
                        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
                            <Typography variant="body2" weight="bold" className="text-[#136dec] dark:text-[#60a5fa] ml-1">
                                {t('registerHere')}
                            </Typography>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
