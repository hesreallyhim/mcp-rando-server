import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { secureRandomInt } from "../utils/crypto.js";

export function registerStringTools(server: McpServer): void {
  // Generate random string
  server.tool(
    "random-string",
    "Generate a cryptographically secure random string with specified characteristics",
    {
      length: z.number().describe("Length of the string").default(8),
      charset: z.enum(["alphanumeric", "letters", "numbers", "lowercase", "uppercase", "symbols"])
        .describe("Character set to use").default("alphanumeric"),
      count: z.number().describe("Number of random strings to generate").default(1).optional(),
    },
    async ({ length, charset, count = 1 }): Promise<CallToolResult> => {
      const charsets = {
        alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        lowercase: "abcdefghijklmnopqrstuvwxyz",
        uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
      };

      const chars = charsets[charset];
      const strings: string[] = [];

      for (let s = 0; s < count; s++) {
        let result = "";
        for (let i = 0; i < length; i++) {
          const randomIndex = secureRandomInt(0, chars.length - 1);
          result += chars.charAt(randomIndex);
        }
        strings.push(result);
      }

      return {
        content: [{
          type: "text",
          text: count === 1
            ? `Cryptographically secure random string: ${strings[0]}`
            : `Cryptographically secure random strings: ${strings.join(", ")}`
        }]
      };
    }
  );
}