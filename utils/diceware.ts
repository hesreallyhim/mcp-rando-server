import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { secureRandomInt } from "./crypto.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate cryptographically secure dice rolls (1-6)
 */
export function generateDiceRolls(numDice: number): string {
  let result = "";
  for (let i = 0; i < numDice; i++) {
    result += secureRandomInt(1, 6).toString();
  }
  return result;
}

/**
 * Load and parse a diceware wordlist file
 */
export function loadWordlist(filename: string): Map<string, string> {
  const wordlistPath = join(__dirname, "..", "wordlists", filename);
  const content = readFileSync(wordlistPath, "utf-8");
  const wordMap = new Map<string, string>();

  const lines = content.trim().split("\n");
  for (const line of lines) {
    // TODO: Refactor - brittle
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
}

/**
 * Get the number of dice needed for a wordlist
 */
export function getDiceCount(filename: string | null | undefined): number {
  if (!filename) {
    return 4; // Default to 4 dice if filename is null, undefined, or empty
  }
  
  const diceCountMap: Record<string, number> = {
    "large_wordlist.txt": 5,
    "original_reinhold_wordlist.txt": 5,
    "short_wordlist.txt": 4,
    "short_wordlist_unique_prefixes.txt": 4
  };

  return diceCountMap[filename] ?? 4; // Default to 4 dice if filename not found
}