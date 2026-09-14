const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null | undefined): string {
  return phpFormatter.format(Number.isFinite(Number(value)) ? Number(value) : 0);
}
export function formatCurrencyText(value: string): string {
  return value.replace(/(?:\b(?:USD|US\$)\s*|\$)([\d,]+(?:\.\d{1,2})?)/gi, (_match, amount: string) => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    return Number.isFinite(numericAmount) ? formatCurrency(numericAmount) : _match;
  });
}
