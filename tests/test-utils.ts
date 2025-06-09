// Test utilities and helpers
import { strict as assert } from 'node:assert';

/**
 * Helper to test that a function throws an error
 */
export function assertThrows(fn: () => void, expectedMessage?: string): void {
  try {
    fn();
    assert.fail('Expected function to throw an error');
  } catch (error: any) {
    if (expectedMessage) {
      assert(error.message.includes(expectedMessage), 
        `Expected error message to contain "${expectedMessage}", got: ${error.message}`);
    }
  }
}

/**
 * Helper to test that an async function throws an error
 */
export async function assertThrowsAsync(fn: () => Promise<void>, expectedMessage?: string): Promise<void> {
  try {
    await fn();
    assert.fail('Expected async function to throw an error');
  } catch (error: any) {
    if (expectedMessage) {
      assert(error.message.includes(expectedMessage), 
        `Expected error message to contain "${expectedMessage}", got: ${error.message}`);
    }
  }
}

/**
 * Helper to test that a value is within a range
 */
export function assertInRange(value: number, min: number, max: number, message: string = ''): void {
  assert(value >= min && value <= max, 
    `${message} Expected ${value} to be between ${min} and ${max}`);
}

/**
 * Helper to test that an array contains all expected elements
 */
export function assertArrayContains<T>(array: T[], expectedElements: T[]): void {
  for (const element of expectedElements) {
    assert(array.includes(element), 
      `Expected array to contain ${element}`);
  }
}

/**
 * Helper to test that two arrays have the same elements (regardless of order)
 */
export function assertArraysEqual<T>(actual: T[], expected: T[]): void {
  assert.equal(actual.length, expected.length, 
    `Array lengths differ: actual ${actual.length}, expected ${expected.length}`);
  
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  
  assert.deepEqual(sortedActual, sortedExpected);
}