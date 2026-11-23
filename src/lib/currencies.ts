export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
  rateToUSD: number; // e.g. 1 USD in this currency
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', phoneCode: '+1', rateToUSD: 1.0 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', phoneCode: '+44', rateToUSD: 0.79 },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', phoneCode: '+91', rateToUSD: 86.5 },
  { code: 'DE', name: 'Germany (EU)', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', phoneCode: '+49', rateToUSD: 0.95 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'CA$', phoneCode: '+1', rateToUSD: 1.38 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$', phoneCode: '+61', rateToUSD: 1.54 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', currencySymbol: 'S$', phoneCode: '+65', rateToUSD: 1.34 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', currencySymbol: 'AED', phoneCode: '+971', rateToUSD: 3.67 },
  { code: 'FR', name: 'France (EU)', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', phoneCode: '+33', rateToUSD: 0.95 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', phoneCode: '+81', rateToUSD: 152.0 },
];

export function getCountryByCode(code: string): CountryInfo {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code) || SUPPORTED_COUNTRIES[0];
}

export function formatGlobalAmount(amountUSD: number, currencyCode: string = 'USD'): string {
  const country = SUPPORTED_COUNTRIES.find((c) => c.currency === currencyCode) || SUPPORTED_COUNTRIES[0];
  const converted = amountUSD * country.rateToUSD;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: country.currency,
      maximumFractionDigits: country.currency === 'JPY' ? 0 : 2,
    }).format(converted);
  } catch {
    return `${country.currencySymbol}${converted.toFixed(2)}`;
  }
}
