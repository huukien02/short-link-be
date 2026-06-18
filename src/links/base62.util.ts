const ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length; // 62

/** Encode một số nguyên dương sang chuỗi Base62. */
export function encodeBase62(num: number): string {
  if (num < 0 || !Number.isInteger(num)) {
    throw new Error('encodeBase62 chỉ nhận số nguyên không âm');
  }
  if (num === 0) return ALPHABET[0];
  let result = '';
  let n = num;
  while (n > 0) {
    result = ALPHABET[n % BASE] + result;
    n = Math.floor(n / BASE);
  }
  return result;
}
