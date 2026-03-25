import { supabase } from '@/lib/supabase';
import { AddSubscriptionPayload, Subscription } from '@/types';

export const SubscriptionService = {
    /**
     * Fetch all subscriptions for a specific user.
     */
    async fetchSubscriptions(userId: string): Promise<Subscription[]> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            // Typically sort by due date ascending
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data as Subscription[];
    },

    /**
     * Create a new subscription
     */
    async addSubscription(payload: AddSubscriptionPayload, userId: string): Promise<Subscription> {
        const insertPayload = {
            ...payload,
            user_id: userId,
            // Fallback default status
            status: payload.status || 'Belum Dibayar',
        };

        const { data, error } = await supabase
            .from('subscriptions')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;
        return data as Subscription;
    },

    /**
     * Delete an existing subscription
     */
    async deleteSubscription(subscriptionId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', subscriptionId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Update/Pay a subscription
     */
    async updateSubscription(subscriptionId: string, userId: string, payload: Partial<Subscription>): Promise<Subscription> {
        const { data, error } = await supabase
            .from('subscriptions')
            .update(payload)
            .eq('id', subscriptionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Subscription;
    }
};
