// yss_orbit\frontend\src\shared\utils\dateUtils.ts
export const formatDate = (date: Date | string, locale = 'en-US') => {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
};
