import { StateCreator } from 'zustand';
import { Category } from '@/types';
import { CategoryService } from '@/services/categoryService';

export interface CategorySlice {
    categories: Category[];
    isLoadingCategories: boolean;
    fetchCategories: (userId: string) => Promise<void>;
    addCategory: (userId: string, category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
    updateCategory: (userId: string, categoryId: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (userId: string, categoryId: string) => Promise<void>;
}

export const createCategorySlice: StateCreator<
    CategorySlice,
    [['zustand/persist', unknown]],
    [],
    CategorySlice
> = (set, get) => ({
    categories: [],
    isLoadingCategories: false,

    fetchCategories: async (userId: string) => {
        set({ isLoadingCategories: true });
        try {
            const data = await CategoryService.fetchCategories(userId);
            set({ categories: data });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            throw error;
        } finally {
            set({ isLoadingCategories: false });
        }
    },

    addCategory: async (userId: string, categoryData: Omit<Category, 'id' | 'user_id'>) => {
        set({ isLoadingCategories: true });
        try {
            const newCategory = await CategoryService.addCategory(categoryData, userId);
            set((state) => ({ categories: [...state.categories, newCategory] }));
        } catch (error) {
            console.error('Failed to add category:', error);
            throw error;
        } finally {
            set({ isLoadingCategories: false });
        }
    },

    updateCategory: async (userId: string, categoryId: string, updates: Partial<Category>) => {
        set({ isLoadingCategories: true });
        try {
            const updatedCategory = await CategoryService.updateCategory(categoryId, userId, updates);
            set((state) => ({
                categories: state.categories.map(c => c.id === categoryId ? updatedCategory : c)
            }));
        } catch (error) {
            console.error('Failed to update category:', error);
            throw error;
        } finally {
            set({ isLoadingCategories: false });
        }
    },

    deleteCategory: async (userId: string, categoryId: string) => {
        set({ isLoadingCategories: true });
        try {
            await CategoryService.deleteCategory(categoryId, userId);
            set((state) => ({
                categories: state.categories.filter(c => c.id !== categoryId)
            }));
        } catch (error) {
            console.error('Failed to delete category:', error);
            throw error;
        } finally {
            set({ isLoadingCategories: false });
        }
    }
});
