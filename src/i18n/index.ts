import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'
import en from './en.json'

const savedLang = (() => { try { return localStorage.getItem('fluidz_lang') } catch { return null } })()

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: savedLang || navigator.language.startsWith('en') ? 'en' : 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18n

export function setLanguage(lang: 'fr' | 'en') {
  i18n.changeLanguage(lang)
  try { localStorage.setItem('fluidz_lang', lang) } catch {}
}
