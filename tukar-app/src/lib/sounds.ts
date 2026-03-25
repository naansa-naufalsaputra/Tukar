import { Audio } from 'expo-av';

export const playSound = async (type: 'clink' | 'success' | 'click') => {
  try {
    let soundFile;

    switch (type) {
      case 'clink':
        soundFile = require('@/assets/sounds/clink.mp3');
        break;
      case 'success':
        soundFile = require('@/assets/sounds/success.mp3');
        break;
      default:
        return;
    }

    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();

    // Auto unload from memory after playing
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.isLoaded && status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.warn('Could not play sound:', error);
  }
};
