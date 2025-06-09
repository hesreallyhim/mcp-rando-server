import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { assertInRange, assertArraysEqual, assertThrows } from './test-utils.js';
import { secureRandomInt, secureRandomFloat, secureArrayShuffle, secureRandomChoice } from '../utils/crypto.js';
import { generateDiceRolls, loadWordlist, getDiceCount } from '../utils/diceware.js';

// Utility functions are now directly imported from modules


describe('Core Utility Functions', () => {
  
  describe('secureRandomInt', () => {
    test('should generate numbers within specified range', () => {
      for (let i = 0; i < 100; i++) {
        const result = secureRandomInt(1, 10);
        assertInRange(result, 1, 10, 'Random integer');
        assert(Number.isInteger(result), 'Result should be an integer');
      }
    });

    test('should handle min equals max', () => {
      const result = secureRandomInt(5, 5);
      assert.equal(result, 5);
    });

    test('should handle negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = secureRandomInt(-10, -5);
        assertInRange(result, -10, -5, 'Negative range');
      }
    });

    test('should handle zero in range', () => {
      for (let i = 0; i < 50; i++) {
        const result = secureRandomInt(-2, 2);
        assertInRange(result, -2, 2, 'Range including zero');
      }
    });
  });

  describe('secureRandomFloat', () => {
    test('should generate floats within specified range', () => {
      for (let i = 0; i < 100; i++) {
        const result = secureRandomFloat(0.0, 1.0);
        assertInRange(result, 0.0, 1.0, 'Random float');
        assert(typeof result === 'number', 'Result should be a number');
      }
    });

    test('should handle larger ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = secureRandomFloat(10.5, 20.5);
        assertInRange(result, 10.5, 20.5, 'Larger float range');
      }
    });

    test('should handle negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = secureRandomFloat(-5.0, -1.0);
        assertInRange(result, -5.0, -1.0, 'Negative float range');
      }
    });
  });

  describe('secureArrayShuffle', () => {
    test('should preserve all elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = secureArrayShuffle(original);
      
      assertArraysEqual(shuffled, original);
      assert.equal(shuffled.length, original.length);
    });

    test('should not modify original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      secureArrayShuffle(original);
      
      assert.deepEqual(original, originalCopy);
    });

    test('should handle empty array', () => {
      const result = secureArrayShuffle([]);
      assert.deepEqual(result, []);
    });

    test('should handle single element array', () => {
      const result = secureArrayShuffle([42]);
      assert.deepEqual(result, [42]);
    });

    test('should handle string arrays', () => {
      const original = ['a', 'b', 'c', 'd'];
      const shuffled = secureArrayShuffle(original);
      
      assertArraysEqual(shuffled, original);
    });
  });

  describe('secureRandomChoice', () => {
    test('should pick element from array', () => {
      const choices = [1, 2, 3, 4, 5];
      for (let i = 0; i < 50; i++) {
        const result = secureRandomChoice(choices);
        assert(choices.includes(result), `Result ${result} should be in original array`);
      }
    });

    test('should handle single element array', () => {
      const result = secureRandomChoice([42]);
      assert.equal(result, 42);
    });

    test('should handle string arrays', () => {
      const choices = ['apple', 'banana', 'cherry'];
      for (let i = 0; i < 20; i++) {
        const result = secureRandomChoice(choices);
        assert(choices.includes(result), `Result ${result} should be in choices`);
      }
    });

    test('should eventually pick all elements (probabilistic)', () => {
      const choices = [1, 2, 3];
      const picked = new Set();
      
      // Run enough times to have high probability of picking all elements
      for (let i = 0; i < 100; i++) {
        picked.add(secureRandomChoice(choices));
      }
      
      // With 100 trials, we should pick all 3 elements
      assert.equal(picked.size, 3, 'Should eventually pick all elements');
    });
  });

  describe('generateDiceRolls', () => {
    test('should generate correct number of dice', () => {
      const result = generateDiceRolls(5);
      assert.equal(result.length, 5);
      assert(typeof result === 'string', 'Result should be a string');
    });

    test('should generate valid dice values (1-6)', () => {
      const result = generateDiceRolls(10);
      for (const char of result) {
        const digit = parseInt(char, 10);
        assertInRange(digit, 1, 6, 'Dice roll');
      }
    });

    test('should handle zero dice', () => {
      const result = generateDiceRolls(0);
      assert.equal(result, '');
    });

    test('should handle single die', () => {
      const result = generateDiceRolls(1);
      assert.equal(result.length, 1);
      const digit = parseInt(result, 10);
      assertInRange(digit, 1, 6, 'Single die roll');
    });
  });

  describe('getDiceCount', () => {
    test('should return correct dice count for known files', () => {
      assert.equal(getDiceCount('large_wordlist.txt'), 5);
      assert.equal(getDiceCount('original_reinhold_wordlist.txt'), 5);
      assert.equal(getDiceCount('short_wordlist.txt'), 4);
      assert.equal(getDiceCount('short_wordlist_unique_prefixes.txt'), 4);
    });

    test('should return default for unknown files', () => {
      assert.equal(getDiceCount('unknown_file.txt'), 4);
      assert.equal(getDiceCount(''), 4);
      assert.equal(getDiceCount('some_random_name.txt'), 4);
    });

    test('should handle null and undefined', () => {
      assert.equal(getDiceCount(null), 4);
      assert.equal(getDiceCount(undefined), 4);
    });
  });
});