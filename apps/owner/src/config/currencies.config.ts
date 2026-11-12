export interface CurrencyConfig {
  code: string;       // e.g. 'INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'SGD', 'MYR'
  symbol: string;     // e.g. '₹', '$', '€', '£', 'AED', 'SAR', 'CA$', 'A$', 'S$', 'RM'
  name: string;       // e.g. 'Indian Rupee (INR)'
  position: 'prefix' | 'suffix';
}

// Global list of supported currencies (manageable via Admin Panel in the future)
export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'prefix' },
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'prefix' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'prefix' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'prefix' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', position: 'prefix' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', position: 'prefix' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', position: 'prefix' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'prefix' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'prefix' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', position: 'prefix' },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // Default to INR / Indian Rupee
