import { StateCreator } from 'zustand';
import { Goal } from '@/types';
import { GoalService } from '@/services/goalService';

export interface GoalSlice {
    goals: Goal[];
    isLoadingGoals: boolean;
    fetchGoals: (userId: string) => Promise<void>;
    addGoal: (userId: string, goal: Omit<Goal, 'id' | 'user_id'>) => Promise<void>;
    updateGoal: (userId: string, goalId: string, updates: Partial<Omit<Goal, 'id' | 'user_id'>>) => Promise<void>;
    deleteGoal: (userId: string, goalId: string) => Promise<void>;
}

export const createGoalSlice: StateCreator<
    GoalSlice,
    [['zustand/persist', unknown]],
    [],
    GoalSlice
> = (set, get) => ({
    goals: [],
    isLoadingGoals: false,

    fetchGoals: async (userId: string) => {
        set({ isLoadingGoals: true });
        try {
            const data = await GoalService.fetchGoals(userId);
            set({ goals: data });
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            throw error;
        } finally {
            set({ isLoadingGoals: false });
        }
    },

    addGoal: async (userId: string, goalData: Omit<Goal, 'id' | 'user_id'>) => {
        set({ isLoadingGoals: true });
        try {
            const newGoal = await GoalService.addGoal(goalData, userId);
            set((state) => ({ goals: [...state.goals, newGoal] }));
        } catch (error) {
            console.error('Failed to add goal:', error);
            throw error;
        } finally {
            set({ isLoadingGoals: false });
        }
    },

    updateGoal: async (userId: string, goalId: string, updates: Partial<Omit<Goal, 'id' | 'user_id'>>) => {
        set({ isLoadingGoals: true });
        try {
            const updatedGoal = await GoalService.updateGoal(goalId, userId, updates);
            set((state) => ({
                goals: state.goals.map(g => g.id === goalId ? updatedGoal : g)
            }));
        } catch (error) {
            console.error('Failed to update goal:', error);
            throw error;
        } finally {
            set({ isLoadingGoals: false });
        }
    },

    deleteGoal: async (userId: string, goalId: string) => {
        set({ isLoadingGoals: true });
        try {
            await GoalService.deleteGoal(goalId, userId);
            set((state) => ({
                goals: state.goals.filter(g => g.id !== goalId)
            }));
        } catch (error) {
            console.error('Failed to delete goal:', error);
            throw error;
        } finally {
            set({ isLoadingGoals: false });
        }
    }
});
