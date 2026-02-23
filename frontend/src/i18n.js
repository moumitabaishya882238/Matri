import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';

import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@app_language';

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (storedLang) {
                // Set TTS engine immediately on boot
                if (storedLang === 'hi') {
                    Tts.setDefaultLanguage('hi-IN');
                } else {
                    Tts.setDefaultLanguage('en-US');
                }
                return callback(storedLang);
            }
            return callback('en');
        } catch (error) {
            console.log('Error reading language', error);
            return callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (lng) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lng);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        resources: {
            en: { translation: en },
            hi: { translation: hi },
        },
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false,
        }
    });

export default i18n;
