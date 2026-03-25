import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Delete } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useStoreV2 } from '../store/v2/useStoreV2';

export interface PinModalProps {
  visible: boolean;
  mode: 'set' | 'change' | 'verify';
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'current' | 'new' | 'confirm' | 'verify';

export const PinModal: React.FC<PinModalProps> = ({
  visible,
  mode,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const savePin = useStoreV2((state) => state.savePin);
  const verifyPin = useStoreV2((state) => state.verifyPin);
  const [step, setStep] = useState<Step>(
    mode === 'set' ? 'new' : mode === 'change' ? 'current' : 'verify'
  );
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(mode === 'set' ? 'new' : mode === 'change' ? 'current' : 'verify');
      setPin('');
      setNewPin('');
      setErrorMsg('');
    }
  }, [visible, mode]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (pin.length === 4) {
      handlePinComplete(pin);
    }
  }, [pin]);

  const handlePinComplete = async (enteredPin: string) => {
    try {
      if (step === 'verify' || step === 'current') {
        const isValid = await verifyPin(enteredPin);
        if (isValid) {
          if (step === 'verify') {
            onSuccess();
          } else {
            setStep('new');
            setPin('');
            setErrorMsg('');
          }
        } else {
          handleError(t('pinIncorrect'));
        }
      } else if (step === 'new') {
        setNewPin(enteredPin);
        setStep('confirm');
        setPin('');
        setErrorMsg('');
      } else if (step === 'confirm') {
        if (enteredPin === newPin) {
          await savePin(enteredPin);
          onSuccess();
        } else {
          handleError(t('pinMismatch'));
          setPin('');
        }
      }
    } catch (error) {
      Alert.alert(t('error'), t('unexpectedError'));
      setPin('');
    }
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    shake();
    setTimeout(() => setPin(''), 500);
  };

  const handlePress = (val: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + val);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const getTitle = () => {
    switch (step) {
      case 'current': return t('enterCurrentPin');
      case 'new': return t('createNewPin');
      case 'confirm': return t('confirmNewPin');
      case 'verify': return t('enterPin');
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'new': return t('create4DigitPin');
      case 'confirm': return t('repeatNewPin');
      case 'current':
      case 'verify': return t('verifyIdentity');
    }
  };

  const renderDots = () => {
    return (
      <Animated.View
        style={{ transform: [{ translateX: shakeAnim }] }}
        className="flex-row justify-center items-center space-x-6 mb-8"
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={cn(
              'w-4 h-4 rounded-full mx-3',
              i < pin.length ? 'bg-primary' : 'bg-border'
            )}
          />
        ))}
      </Animated.View>
    );
  };

  const renderNumpad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return (
      <View className="items-center justify-center w-full px-8">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between w-full mb-6">
            {row.map((key, colIndex) => {
              if (key === '') {
                return <View key={colIndex} className="w-20 h-20" />;
              }
              if (key === 'delete') {
                return (
                  <TouchableOpacity
                    key={colIndex}
                    onPress={handleDelete}
                    className="w-20 h-20 rounded-full items-center justify-center active:bg-primary/10"
                  >
                    <Delete size={32} color="#000" className="text-foreground" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={colIndex}
                  onPress={() => handlePress(key)}
                  className="w-20 h-20 rounded-full items-center justify-center active:bg-primary/10"
                >
                  <Text
                    className="text-3xl font-bold text-foreground"
                    style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row justify-between items-center px-6 py-4">
          <TouchableOpacity onPress={onCancel}>
            <Text
              className="text-primary text-lg"
              style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            >
              {t('cancel')}
            </Text>

          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-2xl font-bold text-foreground mb-2 text-center"
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
          >
            {getTitle()}
          </Text>
          <Text
            className="text-base text-muted-foreground mb-12 text-center"
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
          >
            {getSubtitle()}
          </Text>

          {renderDots()}

          <View className="h-6 mb-8">
            {errorMsg ? (
              <Text
                className="text-destructive text-sm text-center"
                style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
              >
                {errorMsg}
              </Text>
            ) : null}
          </View>

          {renderNumpad()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

PinModal.displayName = 'PinModal';
