import { StateCreator } from 'zustand';
import { cancelDailyExpenseReminder } from '@/lib/notifications';
import * as SecureStore from 'expo-secure-store';

const PIN_STORAGE_KEY = 'tukar_app_pin_v2';

export interface SettingsSliceV2 {
    language: string;
    biometricEnabled: boolean;
    remindersEnabled: boolean;
    
    // Actions
    setLanguage: (lang: string) => void;
    toggleBiometric: (enabled: boolean) => void;
    toggleReminders: (enabled: boolean) => Promise<void>;
    savePin: (pin: string) => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    clearPin: () => Promise<void>;
}

export const createSettingsSliceV2: StateCreator<
    SettingsSliceV2,
    [['zustand/persist', unknown]],
    [],
    SettingsSliceV2
> = (set) => ({
    language: 'id',
    biometricEnabled: false,
    remindersEnabled: false,

    setLanguage: (lang: string) => set({ language: lang }),
    toggleBiometric: (enabled: boolean) => set({ biometricEnabled: enabled }),
    toggleReminders: async (enabled: boolean) => {
        set({ remindersEnabled: enabled });
        if (!enabled) {
            cancelDailyExpenseReminder().catch(() => {});
        }
    },
    
    savePin: async (pin: string) => {
        await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
    },
    
    verifyPin: async (pin: string) => {
        const stored = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
        return stored === pin;
    },
    
    clearPin: async () => {
        await SecureStore.deleteItemAsync(PIN_STORAGE_KEY);
    }
});
