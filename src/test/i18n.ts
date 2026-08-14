import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../i18n/locales/en.json'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['main', 'order'],
    defaultNS: 'main',
    resources: {
      en: {
        main: en as Record<string, unknown>,
        order: {},
      },
    },
    interpolation: { escapeValue: false },
  })
}

export default i18n
