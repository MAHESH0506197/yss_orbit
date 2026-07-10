# F12 - INTERNATIONALIZATION (i18n) & TIMEZONE STANDARDS

## 1. Global Localization (Language)
All frontend pages, components, and modules MUST utilize the central `react-i18next` engine. 
**Hardcoding English text directly into React components is strictly forbidden.**

### 1.1 Core Principles
- **Translation Hooks:** Always use `const { t } = useTranslation();` inside React components.
- **Dynamic Usage:** Wrap all user-facing text strings in the translation function (e.g., `<h1>{t('dashboard.title')}</h1>`).
- **Dictionary Files:** All English text must be placed in `src/core/i18n/locales/en.json`. Corresponding translations must be added to `es.json`, `fr.json`, etc.
- **Engine Context:** The translation engine is globally hooked to the `AuthStore`. When the user updates their profile language, the UI will instantaneously translate without a page refresh.

## 2. Global Timezone Management
YSS Orbit is a globally distributed system. UTC is the only acceptable format for backend data storage, but the UI must always reflect the user's specific localized timezone.

### 2.1 Core Principles
- **No Native Date Objects:** Never use `new Date().toLocaleString()` or `new Date().toLocaleDateString()` for rendering timestamps. This relies on the browser's local timezone, which ignores the user's database preference.
- **Global Utility Hook:** All dates and times rendered in the UI MUST pass through the global `formatUserDate()` utility from `src/utils/date.ts`.
- **Usage Example:** `{formatUserDate(profile.created_at, 'MMM dd, yyyy')}`
- **Engine Context:** `formatUserDate()` dynamically reads the user's explicit timezone preference from the `AuthStore` (e.g., `Asia/Kolkata` or `America/New_York`) and automatically shifts the UTC timestamp into that timezone using `date-fns-tz`.
