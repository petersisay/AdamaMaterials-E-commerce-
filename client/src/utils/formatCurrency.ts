/**
 * Consistent ETB Currency Formatter across Revola Marketplace
 */
export function formatETB(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return `${num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })} ETB`;
}
