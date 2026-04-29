/**
 * formatCurrency — Formats a numeric value into a "k" shorthand.
 * If value is a multiple of 1000, it shows as {n}k (e.g., 25000 -> 25k).
 * If value has hundreds, it shows as {n}.{m}k (e.g., 25900 -> 25.9k).
 *
 * @param {number} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  
  if (value >= 1000) {
    const kValue = value / 1000;
    // Check if it has decimals (hundreds)
    if (value % 1000 === 0) {
      return `${kValue}k`;
    } else {
      // Return with one decimal if there are hundreds
      return `${kValue.toFixed(1)}k`;
    }
  }
  
  return value.toLocaleString();
};
