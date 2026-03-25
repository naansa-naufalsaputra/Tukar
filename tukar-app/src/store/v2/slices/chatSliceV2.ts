import { StateCreator } from 'zustand';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { V3ContextService } from '@/services/v3ContextService';
import { ChatMessage } from '@/types';
import { parseTransactionWithAI, chatWithGemini } from '@/lib/gemini';
import { Logger } from '@/lib/logger';
import i18n from '@/lib/i18n';
import { AiContextData, ChatServiceV2 } from '@/services/chatServiceV2';

export interface ChatSliceV2State {
    chatHistory: ChatMessage[];
    aiContextData: AiContextData | null;
    isPreparingAiContext: boolean;
    isParsingAI: boolean;
    // Actions
    loadChatHistory: (userId: string) => Promise<void>;
    clearChatHistory: (userId?: string) => void;
    addChatMessage: (msg: ChatMessage, userId?: string) => void;
    parseAIInput: (text: string) => Promise<any | null>;
    sendMsgToAI: (text: string, userId: string) => Promise<void>;
    prepareAiContext: (userId: string, month: string, year: string) => Promise<void>;
}

export const createChatSliceV2: StateCreator<
    ChatSliceV2State & any,
    [['zustand/persist', unknown]],
    [],
    ChatSliceV2State
> = (set, get) => ({
    chatHistory: [],
    aiContextData: null,
    isPreparingAiContext: false,
    isParsingAI: false,

    loadChatHistory: async (userId: string) => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('chat_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) {
            Logger.error('Error loading chat history:', error);
            return;
        }
        set({ chatHistory: data || [] });
    },

    clearChatHistory: (userId?: string) => {
        set({ chatHistory: [] });
        if (!supabase || !userId) return;
        supabase.from('chat_history').delete().eq('user_id', userId).catch(e => Logger.error(e));
    },

    addChatMessage: (msg: ChatMessage, userId?: string) => {
        set((state) => ({ chatHistory: [...state.chatHistory, msg] }));
        if (!supabase || !userId) return;
        supabase.from('chat_history').insert({
            user_id: userId,
            text: msg.content ?? msg.text,
            sender: msg.role === 'ai' ? 'bot' : (msg.sender ?? msg.role ?? 'user'),
            time: msg.time ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: msg.options ?? null,
        }).catch(e => Logger.error(e));
    },

    parseAIInput: async (text: string) => {
        set({ isParsingAI: true });
        try {
            const data = await parseTransactionWithAI(text, get().categories, get().wallets);
            return data;
        } catch (error) {
            Logger.error('Error parsing AI info:', error);
            return null;
        } finally {
            set({ isParsingAI: false });
        }
    },

    sendMsgToAI: async (text: string, userId: string) => {
        const userMsg: ChatMessage = { 
            id: Crypto.randomUUID(), 
            role: 'user', 
            content: text, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        set(state => ({ chatHistory: [...state.chatHistory, userMsg] }));
        
        try {
            // V3: Context Optimization
            const state = get();
            const allTx = state.transactions || [];
            const relevantTx = V3ContextService.getRelevantTransactions(text, allTx, 10);
            
            const optimizedContext = {
                ...state.aiContextData,
                relevantTransactions: relevantTx,
                currentMonthTransactions: undefined // Save token, don't send all!
            };

            const reply = await chatWithGemini(text, JSON.stringify(optimizedContext));
            const aiMsg: ChatMessage = { 
                id: Crypto.randomUUID(), 
                role: 'ai', 
                content: reply, 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            get().addChatMessage(aiMsg, userId);
        } catch (error) {
            Logger.error('sendMsgToAI error:', error);
        }
    },

    prepareAiContext: async (userId: string, month: string, year: string) => {
        set({ isPreparingAiContext: true });
        try {
            const context = await ChatServiceV2.fetchAiContext(userId, month, year);
            set({ aiContextData: context });
        } catch (error) {
            console.error('Failure in prepareAiContext action', error);
        } finally {
            set({ isPreparingAiContext: false });
        }
    }
});
