const React = require('react');
const { View } = require('react-native');

// Mock Moti components as simple Views
jest.mock('moti', () => ({
    View: (props) => React.createElement(View, props),
    AnimatePresence: (props) => props.children,
}));

// Mock Lucide icons as simple Views
jest.mock('lucide-react-native', () => {
    return new Proxy({}, {
        get: () => (props) => React.createElement(View, props)
    });
});

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: () => 'test-uuid-' + Math.random(),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(),
}));

// Mock nativewind
jest.mock('nativewind', () => ({
    colorScheme: {
        get: jest.fn(() => 'dark'),
        set: jest.fn(),
        toggle: jest.fn(),
    },
}));

// Mock i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { changeLanguage: jest.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('i18next', () => ({
    t: (key) => key,
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
}));
