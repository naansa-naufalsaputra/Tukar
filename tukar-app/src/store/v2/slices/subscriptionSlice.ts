import { StateCreator } from 'zustand';
import { Subscription, AddSubscriptionPayload } from '@/types';
import { SubscriptionService } from '@/services/subscriptionService';

export interface SubscriptionSlice {
    subscriptions: Subscription[];
    isLoadingSubscriptions: boolean;
    fetchSubscriptions: (userId: string) => Promise<void>;
    addSubscription: (userId: string, payload: AddSubscriptionPayload) => Promise<void>;
    updateSubscription: (userId: string, subscriptionId: string, updates: Partial<Subscription>) => Promise<void>;
    deleteSubscription: (userId: string, subscriptionId: string) => Promise<void>;
}

export const createSubscriptionSlice: StateCreator<
    SubscriptionSlice,
    [['zustand/persist', unknown]],
    [],
    SubscriptionSlice
> = (set, get) => ({
    subscriptions: [],
    isLoadingSubscriptions: false,

    fetchSubscriptions: async (userId: string) => {
        set({ isLoadingSubscriptions: true });
        try {
            const data = await SubscriptionService.fetchSubscriptions(userId);
            set({ subscriptions: data });
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            throw error;
        } finally {
            set({ isLoadingSubscriptions: false });
        }
    },

    addSubscription: async (userId: string, payload: AddSubscriptionPayload) => {
        set({ isLoadingSubscriptions: true });
        try {
            const newSub = await SubscriptionService.addSubscription(payload, userId);
            set((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
        } catch (error) {
            console.error('Failed to add subscription:', error);
            throw error;
        } finally {
            set({ isLoadingSubscriptions: false });
        }
    },

    updateSubscription: async (userId: string, subscriptionId: string, updates: Partial<Subscription>) => {
        set({ isLoadingSubscriptions: true });
        try {
            const updatedSub = await SubscriptionService.updateSubscription(subscriptionId, userId, updates);
            set((state) => ({
                subscriptions: state.subscriptions.map(s => s.id === subscriptionId ? updatedSub : s)
            }));
        } catch (error) {
            console.error('Failed to update subscription:', error);
            throw error;
        } finally {
            set({ isLoadingSubscriptions: false });
        }
    },

    deleteSubscription: async (userId: string, subscriptionId: string) => {
        set({ isLoadingSubscriptions: true });
        try {
            await SubscriptionService.deleteSubscription(subscriptionId, userId);
            set((state) => ({
                subscriptions: state.subscriptions.filter(s => s.id !== subscriptionId)
            }));
        } catch (error) {
            console.error('Failed to delete subscription:', error);
            throw error;
        } finally {
            set({ isLoadingSubscriptions: false });
        }
    }
});
