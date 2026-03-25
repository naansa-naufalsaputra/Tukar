import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

export const CategoryService = {
    /**
     * Fetch all categories for a user.
     */
    async fetchCategories(userId: string): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data as Category[];
    },

    /**
     * Creates a new category.
     */
    async addCategory(payload: Omit<Category, 'id' | 'user_id'>, userId: string): Promise<Category> {
        const insertPayload = { ...payload, user_id: userId };

        const { data, error } = await supabase
            .from('categories')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;
        return data as Category;
    },

    /**
     * Delete an existing category.
     */
    async deleteCategory(categoryId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Update category.
     */
    async updateCategory(categoryId: string, userId: string, payload: Partial<Category>): Promise<Category> {
        const { data, error } = await supabase
            .from('categories')
            .update(payload)
            .eq('id', categoryId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Category;
    }
};
