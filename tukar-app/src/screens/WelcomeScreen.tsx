import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroAnimation from '../components/animations/HeroAnimation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WelcomeScreen'>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { t } = useTranslation();
  return (
    // Memaksa background mengambil warna tema
    <SafeAreaView className="flex-1 bg-background justify-between pb-12 pt-8">
      
      <View className="flex-1 justify-center px-6">
        {/* Animasi AI Spark yang baru */}
        <HeroAnimation />
        
        <View className="items-center mt-6">
          <Text className="text-foreground text-4xl font-bold tracking-tight mb-3">
            Tukar AI
          </Text>
          <Text className="text-muted-foreground text-center text-base px-2 leading-relaxed">
            {t('welcomeDesc')}
          </Text>
        </View>
      </View>

      <View className="px-6 gap-4">
        {/* Tombol Utama (Warna Primary Theme) */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('SignupScreen')}
          className="bg-primary py-4 rounded-2xl items-center flex-row justify-center"
        >
          <Text className="text-primary-foreground font-bold text-lg">{t('getStarted')}</Text>
        </TouchableOpacity>

        {/* Tombol Sekunder (Garis Tepi) */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('LoginScreen')}
          className="py-4 rounded-2xl items-center border-2 border-border bg-transparent"
        >
          <Text className="text-foreground font-bold text-lg">{t('alreadyHaveAccount')}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
