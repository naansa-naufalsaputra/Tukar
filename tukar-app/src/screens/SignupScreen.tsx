import React, { useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { Logger } from '../lib/logger';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, ArrowLeft, Check } from 'lucide-react-native';
import { Typography } from '../components/Typography';
import { supabase } from '../lib/supabase';
import { useStoreV2 } from '../store/v2/useStoreV2';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type SignupScreenProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'SignupScreen'> };
export default function SignupScreen({ navigation }: SignupScreenProps) {
    const { currentTheme } = useStoreV2();
    const isDark = currentTheme === 'dark';
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignup = async () => {
        if (!email || !password || !name || !confirmPassword) {
            Alert.alert(t('warning'), t('allFieldsRequired'));
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert(t('warning'), t('passwordMismatch'));
            return;
        }
        if (!agreeTerms) {
            Alert.alert(t('warning'), t('mustAgreeTerms'));
            return;
        }

        setIsLoading(true);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            Alert.alert(t('signupFailed'), authError.message);
            setIsLoading(false);
            return;
        }

        Alert.alert(t('success'), t('accountCreated'));
        navigation.navigate('LoginScreen');
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            const redirectTo = makeRedirectUri();
            Logger.info('GoogleAuth redirect URI', { redirectTo });
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
                        Alert.alert(t('success'), t('googleSignupSuccess'));
                    }
                }
            }
        } catch (error) {
            Alert.alert(t('googleLoginFailed'), error instanceof Error ? error.message : String(error));
        }
    };
    return (
        <SafeAreaView className="flex-1 bg-[#f6f7f8] dark:bg-[#121212]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
                    {/* Mobile Container from template */}
                    <View className="w-full max-w-[430px] flex-1 bg-white dark:bg-[#121212] sm:rounded-xl sm:my-8 overflow-hidden shadow-none sm:shadow-xl dark:shadow-none">

                        {/* Header / Nav */}
                        <View className="flex-row items-center p-4 pb-2 justify-between">
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-100 dark:active:bg-white/10 transition-colors"
                            >
                                <ArrowLeft size={24} color={isDark ? "#FFF" : "#0f172a"} />
                            </TouchableOpacity>
                            <Typography variant="body1" weight="bold" className="flex-1 text-center pr-10 text-slate-900 dark:text-white text-lg tracking-tight">
                                {t('signupTitle')}
                            </Typography>
                        </View>

                        {/* Scrollable Content Inside Panel */}
                        <View className="flex-1 px-6 pb-8">
                            <Typography variant="h1" className="text-[32px] font-bold leading-tight pb-2 pt-4 text-slate-900 dark:text-white tracking-tight">
                                {t('createNewAccount')}
                            </Typography>
                            <Typography variant="body2" className="text-base text-slate-500 dark:text-slate-400 pb-8 pt-1 leading-normal">
                                {t('signupSubtitle')}
                            </Typography>

                            <View className="space-y-5">
                                {/* Name Input */}
                                <View>
                                    <Typography variant="body2" weight="semibold" className="pb-2 ml-1 text-slate-900 dark:text-white text-sm">
                                        {t('fullName')}
                                    </Typography>
                                    <View className="flex-row items-center bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-transparent focus-within:border-[#136dec] dark:focus-within:border-[#3b82f6] rounded-xl h-14 px-4 overflow-hidden">
                                        <UserIcon size={20} color={isDark ? "#9ca3af" : "#94a3b8"} className="mr-3" />
                                        <TextInput
                                            value={name}
                                            onChangeText={setName}
                                            placeholder={t('fullNamePlaceholder')}
                                            placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                                            autoCapitalize="words"
                                            className="flex-1 text-base text-slate-900 dark:text-white h-full"
                                        />
                                    </View>
                                </View>

                                {/* Email Input */}
                                <View>
                                    <Typography variant="body2" weight="semibold" className="pb-2 ml-1 text-slate-900 dark:text-white text-sm">
                                        {t('emailLabel')}
                                    </Typography>
                                    <View className="flex-row items-center bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-transparent rounded-xl h-14 px-4 overflow-hidden">
                                        <Mail size={20} color={isDark ? "#9ca3af" : "#94a3b8"} className="mr-3" />
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="contoh@email.com"
                                            placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            className="flex-1 text-base text-slate-900 dark:text-white h-full"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View>
                                    <Typography variant="body2" weight="semibold" className="pb-2 ml-1 text-slate-900 dark:text-white text-sm">
                                        {t('passwordLabel')}
                                    </Typography>
                                    <View className="flex-row items-center bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-transparent rounded-xl h-14 px-4 overflow-hidden">
                                        <Lock size={20} color={isDark ? "#9ca3af" : "#94a3b8"} className="mr-3" />
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder={t('minCharsPassword')}
                                            placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                                            secureTextEntry={!showPassword}
                                            className="flex-1 text-base text-slate-900 dark:text-white h-full"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2 -mr-2">
                                            {showPassword ? (
                                                <EyeOff size={20} color={isDark ? "#9ca3af" : "#94a3b8"} />
                                            ) : (
                                                <Eye size={20} color={isDark ? "#9ca3af" : "#94a3b8"} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Confirm Password Input */}
                                <View>
                                    <Typography variant="body2" weight="semibold" className="pb-2 ml-1 text-slate-900 dark:text-white text-sm">
                                        {t('confirmPassword')}
                                    </Typography>
                                    <View className="flex-row items-center bg-slate-50 dark:bg-[#2c2c2c] border border-slate-200 dark:border-transparent rounded-xl h-14 px-4 overflow-hidden">
                                        <Lock size={20} color={isDark ? "#9ca3af" : "#94a3b8"} className="mr-3" />
                                        <TextInput
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder={t('repeatPassword')}
                                            placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                                            secureTextEntry={!showConfirmPassword}
                                            className="flex-1 text-base text-slate-900 dark:text-white h-full"
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-2 -mr-2">
                                            {showConfirmPassword ? (
                                                <EyeOff size={20} color={isDark ? "#9ca3af" : "#94a3b8"} />
                                            ) : (
                                                <Eye size={20} color={isDark ? "#9ca3af" : "#94a3b8"} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Terms Checkbox */}
                                <TouchableOpacity
                                    onPress={() => setAgreeTerms(!agreeTerms)}
                                    className="flex-row items-start py-2 mt-2 gap-3 group"
                                    activeOpacity={0.8}
                                >
                                    <View className={`w-5 h-5 rounded border items-center justify-center mt-0.5 transition-colors ${agreeTerms
                                        ? (isDark ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-[#136dec] border-[#136dec]')
                                        : (isDark ? 'bg-[#2c2c2c] border-slate-600' : 'bg-white border-slate-300')
                                        }`}>
                                        {agreeTerms && <Check size={14} color="#FFF" />}
                                    </View>
                                    <View className="flex-1">
                                        <Typography variant="body2" className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                                            {t('agreeTermsPrefix')} <Typography variant="body2" weight="semibold" className={isDark ? "text-[#60a5fa]" : "text-[#136dec]"}>{t('termsAndConditions')}</Typography> {t('andText')} <Typography variant="body2" weight="semibold" className={isDark ? "text-[#60a5fa]" : "text-[#136dec]"}>{t('privacyPolicy')}</Typography> Tukar.
                                        </Typography>
                                    </View>
                                </TouchableOpacity>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleSignup}
                                    disabled={isLoading}
                                    className={`mt-4 h-[56px] w-full items-center justify-center rounded-full shadow-lg transition-all ${isLoading
                                        ? 'bg-[#136dec]/50 dark:bg-[#3b82f6]/50 shadow-[#136dec]/10 dark:shadow-[#3b82f6]/10'
                                        : 'bg-[#136dec] dark:bg-[#3b82f6] shadow-[#136dec]/30 dark:shadow-[#3b82f6]/20'
                                        }`}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Typography variant="body1" weight="bold" className="text-white text-base">
                                            {t('signupTitle')}
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
                                    className="h-[56px] w-full flex-row items-center justify-center bg-white dark:bg-[#1e1e1e] rounded-full border border-slate-200 dark:border-[#333333] shadow-sm"
                                >
                                    <Typography variant="h3" weight="bold" className="text-slate-800 dark:text-white mr-3">G</Typography>
                                    <Typography variant="body1" weight="bold" className="text-slate-800 dark:text-white">{t('continueWithGoogle')}</Typography>
                                </TouchableOpacity>

                            </View>

                            {/* Bottom Login Link */}
                            <View className="flex-row items-center justify-center pt-8 pb-4 space-x-1.5">
                                <Typography variant="body2" className="text-sm text-slate-500 dark:text-slate-400">
                                    {t('haveAccountAlready')}
                                </Typography>
                                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                                    <Typography variant="body2" weight="bold" className={`text-sm ${isDark ? "text-[#60a5fa]" : "text-[#136dec]"}`}>
                                        {t('loginTitle')}
                                    </Typography>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}