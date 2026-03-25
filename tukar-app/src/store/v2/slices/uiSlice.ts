import { StateCreator } from 'zustand';
import { colorScheme } from 'nativewind';

export interface UISliceV2 {
    currentTheme: 'light' | 'dark';
    isLoading: boolean;
    isParsingAI: boolean;
    selectedMonth: string; // ISO String to prevent persist issues with Date objects
    isHideBalance: boolean;
    
    // Actions
    toggleTheme: (value?: boolean) => void;
    setSelectedMonth: (date: Date) => void;
    toggleHideBalance: () => void;
    setParsingAI: (parsing: boolean) => void;
    setLoading: (loading: boolean) => void;
}

const resolveTheme = () => (colorScheme.get() === 'dark' ? 'dark' : 'light');

export const createUISliceV2: StateCreator<
    UISliceV2,
    [['zustand/persist', unknown]],
    [],
    UISliceV2
> = (set) => ({
    currentTheme: resolveTheme(),
    isLoading: false,
    isParsingAI: false,
    selectedMonth: new Date().toISOString(),
    isHideBalance: false,

    toggleTheme: (value) => set((state) => {
        const newTheme = typeof value === 'boolean'
            ? (value ? 'dark' : 'light')
            : (state.currentTheme === 'light' ? 'dark' : 'light');
        colorScheme.set(newTheme);
        return { currentTheme: newTheme };
    }),
    
    setSelectedMonth: (date: Date) => set({ selectedMonth: date.toISOString() }),
    toggleHideBalance: () => set((state) => ({ isHideBalance: !state.isHideBalance })),
    setParsingAI: (parsing: boolean) => set({ isParsingAI: parsing }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
});
