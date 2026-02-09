// Fund Capital Utilities
// This module handles fund capital operations

export function validateFundCapital(capital: string): boolean {
  const value = parseFloat(capital);
  return !isNaN(value) && value > 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'DZD',
  }).format(value);
}

// Note: setFundCapital is now handled through supabase-queries.ts
// This is maintained for backward compatibility and organization
