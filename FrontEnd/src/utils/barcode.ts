// The camera sometimes misreads a barcode. Every barcode ends with a check digit, so we
// can reject most misreads on the phone before asking the backend. Same rule as the backend.
export const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a'] as const;

export function isValidBarcode(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop() as number;
  // Weights 3,1,3,1... counted from the digit next to the check digit.
  const total = digits
    .reverse()
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (total % 10)) % 10 === check;
}
