import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WishlistScreen from '../screens/WishlistScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { supabase } from '../lib/supabase';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ManageWalletsScreen from '../screens/ManageWalletsScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import AddWalletScreen from '../screens/AddWalletScreen';
import { TransactionsHistoryScreen } from '../screens/TransactionsHistoryScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { useStoreV2 } from '../store/v2/useStoreV2';
import { Session } from '@supabase/supabase-js';
import { scheduleDailyExpenseReminder } from '../lib/notifications';
import { Logger } from '../lib/logger';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const [session, setSession] = useState<Session | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const fetchInitialData = useStoreV2(state => state.fetchInitialData);
    const subscribeToChanges = useStoreV2(state => state.subscribeToChanges);

    useEffect(() => {
        // Check session on first load
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.auth.getSession().then(({ data: { session: s } }) => {
                    setSession(s);
                    setIsInitializing(false);
                });
            } else {
                setIsInitializing(false);
            }
        });

        // Dengarkan perubahan login/logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            fetchInitialData(session.user.id);
            subscribeToChanges(session.user.id);
            // Schedule pengingat harian jam 20:00 (jika user belum input hari ini)
            scheduleDailyExpenseReminder().catch((err) => Logger.error('RootNavigator:notification', err));
        }
    }, [session?.user?.id]);

    if (isInitializing) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    // User sudah Login -> Masuk ke Aplikasi Utama
                    <>
                        <Stack.Screen name="MainTabs" component={BottomTabs} />
                        <Stack.Screen
                            name="ChatScreen"
                            component={ChatScreen}
                            options={{ gestureEnabled: true }}
                        />
                        <Stack.Screen
                            name="Wishlist"
                            component={WishlistScreen}
                            options={{ gestureEnabled: true }}
                        />
                        <Stack.Screen
                            name="AddTransactionScreen"
                            component={AddTransactionScreen}
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="Subscriptions"
                            component={SubscriptionsScreen}
                            options={{ gestureEnabled: true }}
                        />
                        <Stack.Screen
                            name="ManageCategoriesScreen"
                            component={ManageCategoriesScreen}
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="ManageWalletsScreen"
                            component={ManageWalletsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AddCategoryScreen"
                            component={AddCategoryScreen}
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="TransactionsHistoryScreen"
                            component={TransactionsHistoryScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AnalyticsScreen"
                            component={AnalyticsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AddWalletScreen"
                            component={AddWalletScreen}
                            options={{ presentation: 'modal' }}
                        />
                    </>
                ) : (
                    // User belum Login -> Masuk ke Auth Flow
                    <>
                        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
                        <Stack.Screen name="LoginScreen" component={LoginScreen} />
                        <Stack.Screen name="SignupScreen" component={SignupScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
