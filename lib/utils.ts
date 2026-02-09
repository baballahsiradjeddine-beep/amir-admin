import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

/** تنسيق التاريخ مع التوقيت بالضبط (للمعاملات) */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

// Exchange rates to DZD (Algerian Dinar)
const EXCHANGE_RATES: Record<string, number> = {
  'USD': 134.50,  // 1 USD = 134.50 DZD
  'RMB': 18.75,   // 1 RMB = 18.75 DZD
  'EUR': 145.00,  // 1 EUR = 145 DZD
  'GBP': 168.00,  // 1 GBP = 168 DZD
  'DZD': 1,       // 1 DZD = 1 DZD
};

export function convertToDZD(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency] || 1;
  return amount * rate;
}

export function getCurrencyLabel(currency: string): string {
  const labels: Record<string, string> = {
    'USD': 'دولار أمريكي',
    'RMB': 'يوان صيني',
    'EUR': 'يورو',
    'GBP': 'جنيه إسترليني',
    'DZD': 'دينار جزائري',
  };
  return labels[currency] || currency;
}

export function formatCurrency(num: number): string {
  if (num === undefined || num === null) return '0';
  const isNegative = num < 0;
  // Use 2 decimal places but only show them if they aren't .00
  const str = Math.abs(num).toFixed(2);
  const parts = str.split('.');
  // Replace comma with space as thousands separator
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const formatted = parts[1] === '00' ? parts[0] : parts.join('.');
  return isNegative ? `-${formatted}` : formatted;
}
