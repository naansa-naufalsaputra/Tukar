import React, { useEffect, useMemo, useState } from 'react';
import { View, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Check, Plus } from 'lucide-react-native';
import { Typography } from './Typography';
import { useTranslation } from 'react-i18next';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { supabase } from '@/lib/supabase';
import { Goal } from '@/types';

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    goalToEdit?: Goal;
}

export function AddGoalModal({ visible, onClose, goalToEdit }: AddGoalModalProps) {
    const { addGoal, updateGoal } = useStoreV2();
    const { t } = useTranslation();
    const [userId, setUserId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [targetAmount, setTargetAmount] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user?.id) setUserId(user.id);
        });
    }, []);
    useEffect(() => {
        if (goalToEdit) {
            setTitle(goalToEdit.title);
            setCategory(goalToEdit.category);
            setTargetAmount(goalToEdit.target_amount.toString());
        } else {
            setTitle('');
            setCategory('');
            setTargetAmount('');
        }
    }, [goalToEdit, visible]);

    const parsedTarget = useMemo(() => {
        const numeric = Number(targetAmount.replace(/[^0-9]/g, '')) || 0;
        return numeric;
    }, [targetAmount]);

    const canSave = Boolean(userId && title.trim() && parsedTarget > 0);

    const handleSave = () => {
        if (!userId || !title.trim() || parsedTarget <= 0) return;

        if (goalToEdit) {
            updateGoal(goalToEdit.id, {
                title: title.trim(),
                category: category.trim() || 'General',
                target_amount: parsedTarget,
            }, userId);
        } else {
            addGoal({
                title: title.trim(),
                category: category.trim() || 'General',
                target_amount: parsedTarget,
                current_amount: 0
            }, userId);
        }

        setTitle('');
        setCategory('');
        setTargetAmount('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end bg-black/60 dark:bg-black/80"
            >
                <View className="bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 min-h-[60%] flex flex-col">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Typography variant="h3" weight="bold">{goalToEdit ? t('editGoal') : t('addGoal')}</Typography>
                            <Typography variant="body2" className="text-slate-500 mt-1">{goalToEdit ? t('editGoalDesc') : t('addGoalDesc')}</Typography>
                        </View>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* ScrollView for Form */}
                    <ScrollView className="flex-1 mb-6">
                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('goalName')}</Typography>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t('exampleGoal')}
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('category')}</Typography>
                            <TextInput
                                value={category}
                                onChangeText={setCategory}
                                placeholder={t('exampleTravel')}
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View className="mb-5">
                            <Typography variant="caption" className="text-slate-500 font-medium mb-2">{t('target')}</Typography>
                            <TextInput
                                value={targetAmount}
                                onChangeText={(text) => {
                                    const rawValue = text.replace(/[^0-9]/g, '');
                                    if (rawValue) {
                                        const formatted = new Intl.NumberFormat('id-ID').format(Number(rawValue));
                                        setTargetAmount(formatted);
                                    } else {
                                        setTargetAmount('');
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="Rp 0"
                                className="bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 font-medium"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                    </ScrollView>

                    {/* Footer Action */}
                    <View className="flex-row justify-between">
                        <TouchableOpacity
                            className={`flex-1 py-4 rounded-xl flex-row justify-center items-center ${canSave ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            onPress={handleSave}
                            disabled={!canSave}
                        >
                            <Plus size={18} color="#FFFFFF" className="mr-2" />
                            <Typography variant="body1" weight="bold" className="text-white">{goalToEdit ? t('updateGoal') : t('saveGoal')}</Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
