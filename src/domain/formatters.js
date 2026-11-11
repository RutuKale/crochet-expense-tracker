/**
 * Wooly Bloom Domain Formatters
 * Currency: INR (₹)
 * Timezone: Asia/Kolkata
 */

/**
 * Format paise or rupee amount into standardized INR format.
 * Defaults to rupee representation with ₹ symbol.
 * @param {number} amountInRupees 
 * @param {boolean} includeSymbol 
 * @returns {string}
 */
export function formatINR(amountInRupees = 0, includeSymbol = true) {
  const numeric = typeof amountInRupees === 'number' && !isNaN(amountInRupees) ? amountInRupees : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Convert rupees to integer paise
 */
export function toPaise(rupees = 0) {
  return Math.round(Number(rupees) * 100);
}

/**
 * Convert paise to rupees
 */
export function toRupees(paise = 0) {
  return Number(paise) / 100;
}

/**
 * Format Date to Asia/Kolkata locale string
 */
export function formatDate(dateInput, includeTime = false) {
  if (!dateInput) return '—';
  const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const options = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {})
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Format quantity with unit (e.g. "500 g", "3 pcs")
 */
export function formatQuantity(qty = 0, unit = 'pcs') {
  const val = Number(qty) || 0;
  return `${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${unit}`;
}
