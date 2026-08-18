import { randomInt } from 'crypto';

/** Generate a cryptographically random 9-digit company identifier. */
export function generateCompanyId() {
  return String(randomInt(100000000, 1000000000));
}

/** Validate the canonical company ID format. */
export function isValidCompanyId(value) {
  return /^\d{9}$/.test(String(value ?? ''));
}
