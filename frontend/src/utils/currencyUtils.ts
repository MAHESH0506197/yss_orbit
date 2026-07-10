// yss_orbit\frontend\src\shared\utils\currencyUtils.ts
export const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};
