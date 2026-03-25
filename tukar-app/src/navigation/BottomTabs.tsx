import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart2, Wallet, User, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { useTranslation } from 'react-i18next';

import HomeScreen from '@/screens/HomeScreen';
import { AnalyticsScreen } from '@/screens/AnalyticsScreen';
import SubscriptionsScreen from '@/screens/SubscriptionsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { AnimatedPressable } from '@/components/animations/AnimatedPressable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
const Tab = createBottomTabNavigator();

type BottomTabsProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;
};

export default function BottomTabs({ navigation }: BottomTabsProps) {
    const { t } = useTranslation();
    const isDark = useStoreV2((state) => state.currentTheme === 'dark');
    const insets = useSafeAreaInsets();
    const tintColor = isDark ? '#60A5FA' : '#2563EB'; // blue-400 : blue-600
    const inactiveColor = isDark ? '#9CA3AF' : '#9CA3AF'; // gray-400
    const bgColor = isDark ? '#1E293B' : '#FFFFFF'; // surface.dark : surface.light

    return (
        <>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarActiveTintColor: tintColor,
                    tabBarInactiveTintColor: inactiveColor,
                    tabBarStyle: {
                        backgroundColor: bgColor,
                        borderTopWidth: 0,
                        elevation: 10,
                        shadowOpacity: 0.1,
                        height: 65 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    },
                }}
            >
                <Tab.Screen
                    name="Beranda"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: t('home'),
                        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="Langganan"
                    component={SubscriptionsScreen}
                    options={{
                        tabBarLabel: t('subscriptions'),
                        tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="AddTransaction"
                    component={View}
                    options={{
                        tabBarLabel: () => null,
                        tabBarButton: (props) => (
                            <AnimatedPressable
                                {...props}
                                scaleTo={0.85}
                                className="top-[-20px] justify-center items-center"
                            >
                                <View className="bg-blue-600 w-14 h-14 rounded-full items-center justify-center border-[4px] border-background shadow-lg shadow-blue-500/50">
                                    <Plus color="white" size={28} />
                                </View>
                            </AnimatedPressable>
                        ),
                    }}
                    listeners={() => ({
                        tabPress: e => {
                            e.preventDefault();
                            navigation.navigate('AddTransactionScreen');
                        },
                    })}
                />
                <Tab.Screen
                    name="Aktivitas"
                    component={AnalyticsScreen}
                    options={{
                        tabBarLabel: t('activity'),
                        tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
                    }}
                />
                <Tab.Screen
                    name="Akun"
                    component={ProfileScreen}
                    options={{
                        tabBarLabel: t('profile'),
                        tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                    }}
                />
            </Tab.Navigator>
        </>
    );
}
