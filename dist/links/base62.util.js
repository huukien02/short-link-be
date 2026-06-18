"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeBase62 = encodeBase62;
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length;
function encodeBase62(num) {
    if (num < 0 || !Number.isInteger(num)) {
        throw new Error('encodeBase62 chỉ nhận số nguyên không âm');
    }
    if (num === 0)
        return ALPHABET[0];
    let result = '';
    let n = num;
    while (n > 0) {
        result = ALPHABET[n % BASE] + result;
        n = Math.floor(n / BASE);
    }
    return result;
}
//# sourceMappingURL=base62.util.js.map