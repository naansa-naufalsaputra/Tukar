import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Sparkles, ChevronLeft, CheckCircle2, Receipt, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { ChatMessage } from '@/types';
import { supabase } from '@/lib/supabase';
import { TypingIndicator } from '@/components/animations/TypingIndicator';
import { TypewriterText } from '@/components/animations/TypewriterText';
import { useTranslation } from 'react-i18next';
import { Logger } from '@/lib/logger';
import { Typography } from '@/components/Typography';
import Animated, { FadeInLeft, FadeInRight, SlideInDown } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
export default function ChatScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { chatHistory, loadChatHistory, sendMsgToAI, clearChatHistory, currentTheme, aiContextData, prepareAiContext, isPreparingAiContext } = useStoreV2();
    const isDark = currentTheme === 'dark';

    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            const id = user?.id || null;
            setUserId(id);
            if (id) {
                loadChatHistory(id);
                // Optionally start preparing AI context if not ready 
                // in real use case you'd pass user inputs, but here we just auto-prime the current month.
                if (!aiContextData) {
                    const currentMonth = (new Date().getMonth() + 1).toString();
                    const currentYear = new Date().getFullYear().toString();
                    prepareAiContext(id, currentMonth, currentYear);
                }
            }
        });
    }, [loadChatHistory, aiContextData, prepareAiContext]);

    // Auto-scroll ke bawah saat ada pesan baru
    useEffect(() => {
        if (chatHistory?.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 200);
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if (!inputText.trim() || isTyping || !userId) return;

        const text = inputText.trim();
        setInputText('');
        setIsTyping(true);

        try {
            await sendMsgToAI(text, userId);
        } catch (error) {
            Logger.error('handleSend error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearChat = () => {
        Alert.alert(
            t('deleteChatTitle'),
            t('deleteChatMessage'),
            [
                { text: t('cancel'), style: "cancel" },
                {
                    text: t('delete'),
                    style: "destructive",
                    onPress: () => {
                        if (userId) {
                            clearChatHistory(userId);
                        }
                    }
                }
            ]
        );
    };

    const renderMessage = ({ item, index }: { item: ChatMessage, index: number }) => {
        const isUser = (item.role ?? item.sender) === 'user';
        const messageText = item.content ?? item.text ?? '';
        const hasTransactions = item.transactions && item.transactions.length > 0;
        const isLatestAIMessage = !isUser && index === chatHistory.length - 1;

        return (
            <Animated.View
                entering={isUser ? FadeInRight.duration(400) : FadeInLeft.duration(400)}
                className={`flex-row w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                {!isUser && (
                    <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-1 border border-primary/20">
                        <Sparkles size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                    </View>
                )}

                <View className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <View
                        className={`px-4 py-3 rounded-3xl ${isUser
                            ? 'bg-primary rounded-tr-sm'
                            : 'bg-card rounded-tl-sm border border-border'
                            }`}
                    >
                        {isLatestAIMessage ? (
                            <TypewriterText
                                className={isUser ? 'text-white' : 'text-foreground'}
                                text={messageText}
                                style={{ fontSize: 15, lineHeight: 22 }}
                            />
                        ) : (
                            <Typography
                                variant="body1"
                                className={isUser ? 'text-white' : 'text-foreground'}
                            >
                                {messageText}
                            </Typography>
                        )}
                    </View>

                    {hasTransactions && !isUser && (
                        <Animated.View
                            entering={SlideInDown.delay(300)}
                            className="mt-2 bg-card border border-emerald-500/20 rounded-2xl p-4 w-full shadow-lg"
                        >
                            <View className="flex-row items-center border-b border-border pb-2 mb-2">
                                <CheckCircle2 size={15} color="#10b981" />
                                <Typography variant="caption" weight="bold" className="text-emerald-500 ml-1.5 uppercase tracking-widest">
                                    {t('successfullyRecorded')}
                                </Typography>
                            </View>

                            {item.transactions!.map((tx: any, idx: number) => (
                                <View key={idx} className="flex-row justify-between items-center py-1">
                                    <View className="flex-row items-center flex-1 pr-2">
                                        <Receipt size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                                        <Typography variant="body2" className="ml-1.5" numberOfLines={1}>
                                            {tx.notes || t('aiTransaction')}
                                        </Typography>
                                    </View>
                                    <Typography variant="body2" weight="bold" className={(tx.transaction_type || tx.type || '').toUpperCase() === 'EXPENSE' ? 'text-foreground' : 'text-emerald-500'}>
                                        Rp {Number(tx.amount).toLocaleString('id-ID')}
                                    </Typography>
                                </View>
                            ))}
                        </Animated.View>
                    )}
                </View>

                {isUser && (
                    <View className="w-8 h-8 rounded-full bg-muted items-center justify-center ml-3 mt-1 border border-border">
                        <User size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-border bg-background z-10">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-1">
                        <ChevronLeft size={24} color={isDark ? '#F8FAFC' : '#0F172A'} />
                    </TouchableOpacity>
                    <View className="w-9 h-9 rounded-2xl bg-primary items-center justify-center mr-3">
                        <Bot size={20} color="#ffffff" />
                    </View>
                    <View>
                        <Typography variant="body1" weight="bold">Tukar AI</Typography>
                        <Typography variant="caption" weight="medium" className="text-emerald-500">{t('smartAssistantActive')}</Typography>
                    </View>
                </View>

                <TouchableOpacity onPress={handleClearChat} className="p-2.5 bg-destructive/10 rounded-2xl">
                    <Trash2 size={18} color="#F87171" />
                </TouchableOpacity>
            </View>

            {/* Context Sync Chip */}
            {isPreparingAiContext ? (
                <Animated.View
                    entering={SlideInDown.duration(400)}
                    className="absolute top-20 left-0 right-0 items-center z-20 pointer-events-none mt-2"
                >
                    <View className="bg-emerald-500/10 backdrop-blur-md rounded-full pl-2 pr-4 py-1.5 border border-emerald-500/20 flex-row items-center gap-2 shadow-lg">
                        <LottieView
                            source={require('@/assets/ai-sync.json')}
                            autoPlay
                            loop
                            style={{ width: 24, height: 24 }}
                        />
                        <Typography variant="caption" className={`${isDark ? 'text-gray-300' : 'text-slate-600'} font-medium`}>
                            Syncing V3 Context...
                        </Typography>
                    </View>
                </Animated.View>
            ) : aiContextData ? (
                <Animated.View
                    entering={SlideInDown.duration(400)}
                    className="absolute top-20 left-0 right-0 items-center z-20 pointer-events-none mt-2"
                >
                    <View className="bg-blue-500/10 backdrop-blur-md rounded-full px-4 py-2 border border-blue-500/20 flex-row items-center gap-2 shadow-lg">
                        <Sparkles size={14} color={isDark ? '#60A5FA' : '#3B82F6'} opacity={0.8} />
                        <Typography variant="caption" className={`${isDark ? 'text-gray-300' : 'text-slate-600'} font-medium`}>
                            Context Synced: {(() => {
                                const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return m[parseInt(aiContextData.month) - 1];
                            })()}/{aiContextData.year}
                        </Typography>
                    </View>
                </Animated.View>
            ) : null}
            {/* CHAT AREA */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    ref={flatListRef}
                    data={chatHistory}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center opacity-30 mt-20">
                            <Sparkles size={48} color={isDark ? '#60A5FA' : '#3B82F6'} />
                            <Typography variant="body2" className="text-center mt-4">
                                {t('chatPlaceholderHint')}
                            </Typography>
                        </View>
                    }
                    ListFooterComponent={
                        isTyping ? (
                            <View className="flex-row items-center mb-6">
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 border border-primary/20">
                                    <Bot size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                </View>
                                <View className="bg-card px-4 py-3 rounded-3xl rounded-tl-sm border border-border items-center justify-center min-w-[60px]">
                                    <TypingIndicator />
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* INPUT AREA */}
                <View className="p-4 bg-background border-t border-border">
                    <View className="flex-row items-end bg-card rounded-3xl border border-border p-1 pl-4">
                        <TextInput
                            className="flex-1 text-foreground font-sans max-h-32 min-h-[44px] pt-3 pb-3"
                            placeholder={t('commandTukarAI')}
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={isTyping || !inputText.trim() || !userId}
                            className={`w-10 h-10 m-1 rounded-2xl items-center justify-center ${inputText.trim() ? 'bg-primary' : 'bg-muted'}`}
                        >
                            <Send size={18} color={inputText.trim() ? '#ffffff' : (isDark ? '#475569' : '#94A3B8')} style={{ marginLeft: -2 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
