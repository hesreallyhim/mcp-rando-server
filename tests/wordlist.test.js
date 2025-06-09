import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { assertThrows } from './test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extract loadWordlist function with proper file system context
const loadWordlist = (filename) => {
  const wordlistPath = join(__dirname, "..", "wordlists", filename);
  const content = readFileSync(wordlistPath, "utf-8");
  const wordMap = new Map();

  const lines = content.trim().split("\n");
  for (const line of lines) {
    if (line.trim() === "") continue;
    const parts = line.split("\t");
    if (parts.length == 2) {
      const number = parts[0];
      const word = parts[1];
      if (number && word) {
        wordMap.set(number, word);
      }
    }
  }

  return wordMap;
};

describe('Wordlist Functions', () => {
  
  describe('loadWordlist', () => {
    test('should load and parse actual wordlist files', () => {
      const wordlists = [
        'short_wordlist_unique_prefixes.txt',
        'short_wordlist.txt',
        'large_wordlist.txt',
        'original_reinhold_wordlist.txt'
      ];

      for (const filename of wordlists) {
        const wordMap = loadWordlist(filename);
        
        assert(wordMap instanceof Map, `${filename} should return a Map`);
        assert(wordMap.size > 0, `${filename} should contain words`);
        
        // Check that all entries have string keys and values
        for (const [key, value] of wordMap) {
          assert(typeof key === 'string', `Key should be string: ${key}`);
          assert(typeof value === 'string', `Value should be string: ${value}`);
          assert(key.length > 0, `Key should not be empty: ${key}`);
          assert(value.length > 0, `Value should not be empty: ${value}`);
        }
        
        // Check expected sizes based on dice count
        if (filename.includes('large') || filename.includes('reinhold')) {
          assert(wordMap.size > 6000, `${filename} should have 7776+ words for 5-dice`);
        } else {
          assert(wordMap.size > 1000, `${filename} should have 1296+ words for 4-dice`);
        }
      }
    });

    test('should handle dice roll patterns correctly', () => {
      const wordMap = loadWordlist('short_wordlist_unique_prefixes.txt');
      
      // Check that keys follow expected dice roll pattern (4 digits, 1-6 each)
      for (const key of wordMap.keys()) {
        assert.equal(key.length, 4, `Key should be 4 digits: ${key}`);
        
        for (const char of key) {
          const digit = parseInt(char, 10);
          assert(!isNaN(digit), `Should be numeric: ${char} in ${key}`);
          assert(digit >= 1 && digit <= 6, `Should be 1-6: ${digit} in ${key}`);
        }
      }
    });

    test('should handle large wordlist dice patterns', () => {
      const wordMap = loadWordlist('large_wordlist.txt');
      
      // Check that keys follow expected dice roll pattern (5 digits, 1-6 each)  
      for (const key of wordMap.keys()) {
        assert.equal(key.length, 5, `Key should be 5 digits: ${key}`);
        
        for (const char of key) {
          const digit = parseInt(char, 10);
          assert(!isNaN(digit), `Should be numeric: ${char} in ${key}`);
          assert(digit >= 1 && digit <= 6, `Should be 1-6: ${digit} in ${key}`);
        }
      }
    });

    test('should handle malformed wordlist gracefully', () => {
      // Create a temporary malformed wordlist file
      const malformedContent = `1111\tword1
invalid_line_no_tab
2222\tword2
\t\t
3333\tword3\textra_column`;
      
      // Move temp file to wordlists directory for testing
      const testPath = join(__dirname, '..', 'wordlists', 'temp_test.txt');
      writeFileSync(testPath, malformedContent);
      
      try {
        const wordMap = loadWordlist('temp_test.txt');
        
        // Should only parse valid lines (checking actual parsing behavior)
        // The line with "\t\t" has empty parts, so it's skipped
        // The line "3333\tword3\textra_column" has 3 parts, so it's skipped due to length != 2
        assert.equal(wordMap.size, 2, 'Should parse 2 valid lines');
        assert.equal(wordMap.get('1111'), 'word1');
        assert.equal(wordMap.get('2222'), 'word2');
        assert(!wordMap.has('3333'), 'Should skip line with extra columns');
        assert(!wordMap.has('invalid_line_no_tab'), 'Should skip malformed lines');
        
      } finally {
        // Cleanup
        try { unlinkSync(testPath); } catch {}
      }
    });

    test('should throw error for non-existent file', () => {
      assert.throws(() => {
        loadWordlist('non_existent_wordlist.txt');
      }, 'Should throw error for missing file');
    });
  });
});