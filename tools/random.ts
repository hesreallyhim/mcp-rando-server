import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { secureRandomInt, secureRandomFloat, secureArrayShuffle, secureRandomChoice } from "../utils/crypto.js";

export function registerRandomTools(server: McpServer): void {
  // Simple random number generator
  server.tool(
    "random-number",
    "Generate a cryptographically secure random number within a specified range",
    {
      min: z.number().describe("Minimum value (inclusive)").default(0),
      max: z.number().describe("Maximum value (inclusive)").default(100),
      count: z.number().describe("Number of random numbers to generate").default(1).optional(),
    },
    async ({ min, max, count = 1 }): Promise<CallToolResult> => {
      if (min > max) {
        return {
          content: [{
            type: "text",
            text: "Error: minimum value cannot be greater than maximum value"
          }],
          isError: true
        };
      }

      const numbers: number[] = [];
      for (let i = 0; i < count; i++) {
        numbers.push(secureRandomInt(min, max));
      }

      return {
        content: [{
          type: "text",
          text: count === 1
            ? `Cryptographically secure random number: ${numbers[0]}`
            : `Cryptographically secure random numbers: ${numbers.join(", ")}`
        }]
      };
    }
  );

  // Random decimal number generator
  server.tool(
    "random-decimal",
    "Generate a cryptographically secure random decimal number within a specified range",
    {
      min: z.number().describe("Minimum value (inclusive)").default(0),
      max: z.number().describe("Maximum value (exclusive)").default(1),
      precision: z.number().describe("Number of decimal places").default(2).optional(),
      count: z.number().describe("Number of random decimals to generate").default(1).optional(),
    },
    async ({ min, max, precision = 2, count = 1 }): Promise<CallToolResult> => {
      if (min >= max) {
        return {
          content: [{
            type: "text",
            text: "Error: minimum value must be less than maximum value"
          }],
          isError: true
        };
      }

      const numbers: number[] = [];
      for (let i = 0; i < count; i++) {
        const randomValue = secureRandomFloat(min, max);
        numbers.push(Number(randomValue.toFixed(precision)));
      }

      return {
        content: [{
          type: "text",
          text: count === 1
            ? `Cryptographically secure random decimal: ${numbers[0]}`
            : `Cryptographically secure random decimals: ${numbers.join(", ")}`
        }]
      };
    }
  );

  // Random choice from a list
  server.tool(
    "random-choice",
    "Pick random item(s) from a provided list using cryptographically secure randomness",
    {
      items: z.array(z.string()).describe("List of items to choose from"),
      count: z.number().describe("Number of items to pick").default(1).optional(),
      allowDuplicates: z.boolean().describe("Allow picking the same item multiple times").default(true).optional(),
    },
    async ({ items, count = 1, allowDuplicates = true }): Promise<CallToolResult> => {
      if (items.length === 0) {
        return {
          content: [{
            type: "text",
            text: "Error: cannot pick from an empty list"
          }],
          isError: true
        };
      }

      if (!allowDuplicates && count > items.length) {
        return {
          content: [{
            type: "text",
            text: `Error: cannot pick ${count} unique items from a list of ${items.length} items`
          }],
          isError: true
        };
      }

      const choices: string[] = [];
      const availableItems = [...items];

      for (let i = 0; i < count; i++) {
        const choice = secureRandomChoice(availableItems);
        choices.push(choice);

        if (!allowDuplicates) {
          const index = availableItems.indexOf(choice);
          availableItems.splice(index, 1);
        }
      }

      return {
        content: [{
          type: "text",
          text: count === 1
            ? `Cryptographically secure random choice: ${choices[0]}`
            : `Cryptographically secure random choices: ${choices.join(", ")}`
        }]
      };
    }
  );

  // Shuffle a list
  server.tool(
    "shuffle-list",
    "Randomly shuffle the order of items in a list using cryptographically secure randomness",
    {
      items: z.array(z.string()).describe("List of items to shuffle"),
    },
    async ({ items }): Promise<CallToolResult> => {
      if (items.length === 0) {
        return {
          content: [{
            type: "text",
            text: "Empty list provided - nothing to shuffle"
          }]
        };
      }

      const shuffled = secureArrayShuffle(items);

      return {
        content: [{
          type: "text",
          text: `Cryptographically secure shuffled list: ${shuffled.join(", ")}`
        }]
      };
    }
  );
}