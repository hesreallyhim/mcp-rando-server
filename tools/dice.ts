import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { secureRandomInt } from "../utils/crypto.js";

export function registerDiceTools(server: McpServer): void {
  // Dice roller
  server.tool(
    "roll-dice",
    "Roll dice with specified number of sides using cryptographically secure randomness",
    {
      sides: z.number().describe("Number of sides on the dice").default(6),
      count: z.number().describe("Number of dice to roll").default(1),
      modifier: z.number().describe("Modifier to add to the total").default(0).optional(),
    },
    async ({ sides, count, modifier = 0 }): Promise<CallToolResult> => {
      if (sides < 2) {
        return {
          content: [{
            type: "text",
            text: "Error: dice must have at least 2 sides"
          }],
          isError: true
        };
      }

      const rolls: number[] = [];
      let total = 0;

      for (let i = 0; i < count; i++) {
        const roll = secureRandomInt(1, sides);
        rolls.push(roll);
        total += roll;
      }

      const finalTotal = total + modifier;
      const modifierText = modifier !== 0 ? ` (${total}${modifier >= 0 ? '+' : ''}${modifier})` : '';

      return {
        content: [{
          type: "text",
          text: count === 1
            ? `Cryptographically secure roll 1d${sides}: ${rolls[0]}${modifierText}`
            : `Cryptographically secure roll ${count}d${sides}: [${rolls.join(", ")}] = ${finalTotal}${modifierText}`
        }]
      };
    }
  );
}