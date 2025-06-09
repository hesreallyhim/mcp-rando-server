import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateDiceRolls, loadWordlist, getDiceCount } from "../utils/diceware.js";

export function registerDicewareTools(server: McpServer): void {
  // Generate diceware passphrase
  server.tool(
    "diceware-passphrase",
    "Generate a cryptographically secure diceware passphrase using word lists",
    {
      words: z.number().describe("Number of words in the passphrase").default(5),
      wordlist: z.enum([
        "short_wordlist_unique_prefixes.txt",
        "short_wordlist.txt",
        "large_wordlist.txt",
        "original_reinhold_wordlist.txt"
      ]).describe("Wordlist to use").default("short_wordlist_unique_prefixes.txt"),
      capitalize: z.boolean().describe("Capitalize first letter of each word").default(false),
    },
    async ({ words, wordlist, capitalize }): Promise<CallToolResult> => {
      try {
        // Load the wordlist
        const wordMap = loadWordlist(wordlist);
        const diceCount = getDiceCount(wordlist);

        // Generate words for the passphrase
        const passphraseWords: string[] = [];
        const diceRolls: string[] = [];

        for (let i = 0; i < words; i++) {
          const roll = generateDiceRolls(diceCount);
          diceRolls.push(roll);

          const word = wordMap.get(roll);
          if (!word) {
            return {
              content: [{
                type: "text",
                text: `Error: No word found for dice roll ${roll} in wordlist ${wordlist}`
              }],
              isError: true
            };
          }

          const finalWord = capitalize
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word;

          passphraseWords.push(finalWord);
        }

        const passphrase = passphraseWords.join(" ");
        const rollsDisplay = diceRolls.join(", ");

        return {
          content: [{
            type: "text",
            text: `Diceware passphrase (${words} words from ${wordlist}):\n\n${passphrase}\n\nDice rolls used: ${rollsDisplay}\n\nThis passphrase was generated using cryptographically secure randomness.`
          }]
        };

      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error generating diceware passphrase: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}