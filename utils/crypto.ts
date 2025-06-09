import { randomBytes, randomInt } from "node:crypto";

/**
 * Generate a cryptographically secure random integer between min and max (inclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max + 1);
}

/**
 * Generate a cryptographically secure random float between min and max
 */
export function secureRandomFloat(min: number, max: number): number {
  // Generate 4 random bytes and convert to a float between 0 and 1
  const randomBuffer = randomBytes(4);
  const randomValue = randomBuffer.readUInt32BE(0) / 0xFFFFFFFF;
  return min + (randomValue * (max - min));
}

/**
 * Cryptographically secure array shuffle using Fisher-Yates algorithm
 */
export function secureArrayShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Pick a random element from an array using crypto
 */
export function secureRandomChoice<T>(array: T[]): T {
  const index = secureRandomInt(0, array.length - 1);
  return array[index];
}