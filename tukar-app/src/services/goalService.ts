import { supabase } from '@/lib/supabase';
import { Goal } from '@/types';

export const GoalService = {
    /**
     * Fetch all financial goals for a user
     */
    async fetchGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            // Typically order by highest progress or newest
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Goal[];
    },

    /**
     * Create a new savings goal
     */
    async addGoal(goalData: Omit<Goal, 'id' | 'user_id'>, userId: string): Promise<Goal> {
        const payload = { ...goalData, user_id: userId };

        const { data, error } = await supabase
            .from('goals')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data as Goal;
    },

    /**
     * Update an existing goal
     */
    async updateGoal(goalId: string, userId: string, payload: Partial<Omit<Goal, 'id' | 'user_id'>>): Promise<Goal> {
        const { data, error } = await supabase
            .from('goals')
            .update(payload)
            .eq('id', goalId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Goal;
    },

    /**
     * Delete a goal
     */
    async deleteGoal(goalId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', goalId)
            .eq('user_id', userId);

        if (error) throw error;
    }
};
