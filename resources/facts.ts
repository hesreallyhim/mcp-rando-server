import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { secureRandomChoice } from "../utils/crypto.js";

export function registerFactsResources(server: McpServer): void {
  // Static resource for random number facts
  server.resource(
    "random-facts",
    "random://facts/numbers",
    { mimeType: "text/plain", description: "Interesting facts about random numbers" },
    async (): Promise<ReadResourceResult> => {
      const facts = [
        "The number 1729 is known as the Hardy-Ramanujan number",
        "42 is famously known as the answer to life, universe, and everything",
        "The number 9 is the only number that when multiplied by any number, the digits always add up to 9",
        "Zero is the only number that cannot be represented in Roman numerals",
        "The number 8 is considered lucky in Chinese culture",
        "Pi has been calculated to over 62.8 trillion decimal places",
        "The number 13 is considered unlucky in many Western cultures",
        "The Fibonacci sequence appears frequently in nature"
      ];

      const randomFact = secureRandomChoice(facts);

      return {
        contents: [{
          uri: "random://facts/numbers",
          text: `Random Number Fact:\n\n${randomFact}\n\nGenerated at: ${new Date().toISOString()}`
        }]
      };
    }
  );
}