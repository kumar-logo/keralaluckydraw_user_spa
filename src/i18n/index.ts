import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

const SUPPORTED_LOCALES = ['en', 'bn-IN', 'gu-IN', 'hi-IN', 'ml-IN', 'mr-IN', 'ta-IN', 'te-IN']

export const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'বাংলা', value: 'bn-IN' },
  { label: 'ગુજરાતી', value: 'gu-IN' },
  { label: 'हिंदी', value: 'hi-IN' },
  { label: 'മലയാളം', value: 'ml-IN' },
  { label: 'मराठी', value: 'mr-IN' },
  { label: 'தமிழ்', value: 'ta-IN' },
  { label: 'తెలుగు', value: 'te-IN' },
]

export const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: 'English',
  'hi-IN': 'हिंदी',
  'ml-IN': 'മലയാളം',
  'ta-IN': 'தமிழ்',
  'te-IN': 'తెలుగు',
  'bn-IN': 'বাংলা',
  'gu-IN': 'ગુજરાતી',
  'mr-IN': 'मराठी',
}

i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: ['en'],
  supportedLngs: SUPPORTED_LOCALES,
  load: 'currentOnly',
  interpolation: { escapeValue: false },
  ns: ['main'],
  defaultNS: 'main',
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng)
})

export default i18n
