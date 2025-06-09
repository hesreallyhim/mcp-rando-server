#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { CallToolResult, GetPromptResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// UTILITY FUNCTIONS: Crypto-based random number generation
// ============================================================================

/**
 * Generate a cryptographically secure random integer between min and max (inclusive)
 */
function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max + 1);
}

/**
 * Generate a cryptographically secure random float between min and max
 */
function secureRandomFloat(min: number, max: number): number {
  // Generate 4 random bytes and convert to a float between 0 and 1
  const randomBuffer = randomBytes(4);
  const randomValue = randomBuffer.readUInt32BE(0) / 0xFFFFFFFF;
  return min + (randomValue * (max - min));
}

/**
 * Cryptographically secure array shuffle using Fisher-Yates algorithm
 */
function secureArrayShuffle<T>(array: T[]): T[] {
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
function secureRandomChoice<T>(array: T[]): T {
  const index = secureRandomInt(0, array.length - 1);
  return array[index];
}

// Create the MCP server
const server = new McpServer({
  name: "random-numbers-server",
  version: "1.0.0"
}, {
  capabilities: {
    logging: {},
    tools: { listChanged: true },
    resources: { listChanged: true },
    prompts: { listChanged: true }
  }
});

// ============================================================================
// TOOLS: Interactive randomization functions
// ============================================================================

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

// Generate UUID
server.tool(
  "generate-uuid",
  "Generate cryptographically secure UUIDs (v4)",
  {
    count: z.number().describe("Number of UUIDs to generate").default(1).optional(),
    format: z.enum(["standard", "no-hyphens", "uppercase"]).describe("UUID format").default("standard").optional(),
  },
  async ({ count = 1, format = "standard" }): Promise<CallToolResult> => {
    const uuids: string[] = [];

    for (let i = 0; i < count; i++) {
      let uuid: string = randomUUID();

      switch (format) {
        case "no-hyphens":
          uuid = uuid.replace(/-/g, "");
          break;
        case "uppercase":
          uuid = uuid.toUpperCase();
          break;
        // "standard" format needs no modification
      }

      uuids.push(uuid);
    }

    return {
      content: [{
        type: "text",
        text: count === 1
          ? `Generated UUID: ${uuids[0]}`
          : `Generated UUIDs: ${uuids.join(", ")}`
      }]
    };
  }
);

// Generate random bytes
server.tool(
  "random-bytes",
  "Generate cryptographically secure random bytes",
  {
    size: z.number().describe("Number of bytes to generate").default(16),
    encoding: z.enum(["hex", "base64", "base64url"]).describe("Output encoding").default("hex"),
    count: z.number().describe("Number of byte sequences to generate").default(1).optional(),
  },
  async ({ size, encoding, count = 1 }): Promise<CallToolResult> => {
    if (size < 1) {
      return {
        content: [{
          type: "text",
          text: "Error: size must be at least 1 byte"
        }],
        isError: true
      };
    }

    const results: string[] = [];

    for (let i = 0; i < count; i++) {
      const bytes = randomBytes(size);
      let encoded: string;

      switch (encoding) {
        case "hex":
          encoded = bytes.toString("hex");
          break;
        case "base64":
          encoded = bytes.toString("base64");
          break;
        case "base64url":
          encoded = bytes.toString("base64url");
          break;
      }

      results.push(encoded);
    }

    return {
      content: [{
        type: "text",
        text: count === 1
          ? `Generated ${size} random bytes (${encoding}): ${results[0]}`
          : `Generated ${size} random bytes each (${encoding}): ${results.join(", ")}`
      }]
    };
  }
);

// ============================================================================
// RESOURCES: Pre-generated random data
// ============================================================================

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

// Dynamic resource for random datasets
server.resource(
  "random-dataset",
  "random://dataset/{type}",
  { mimeType: "application/json", description: "Generate random datasets of various types" },
  async (uri, variables): Promise<ReadResourceResult> => {
    const type = (variables && typeof variables === "object" && "type" in variables) ? (variables as any).type : undefined;
    const size = 10; // Default dataset size

    let dataset: any[] = [];
    if (!type) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: Missing dataset type. Available types: numbers, coordinates, colors, names`
        }]
      };
    }
    switch (type) {
      case "numbers":
        dataset = Array.from({ length: size }, () => secureRandomInt(0, 999));
        break;
      case "coordinates":
        dataset = Array.from({ length: size }, () => ({
          latitude: secureRandomFloat(-90, 90),
          longitude: secureRandomFloat(-180, 180)
        }));
        break;
      case "colors":
        dataset = Array.from({ length: size }, () => ({
          hex: "#" + randomBytes(3).toString('hex'),
          rgb: {
            r: secureRandomInt(0, 255),
            g: secureRandomInt(0, 255),
            b: secureRandomInt(0, 255)
          }
        }));
        break;
      case "names":
        const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
        const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
        dataset = Array.from({ length: size }, () => ({
          first: secureRandomChoice(firstNames),
          last: secureRandomChoice(lastNames)
        }));
        break;
      default:
        return {
          contents: [{
            uri: uri.href,
            text: `Error: Unknown dataset type "${type}". Available types: numbers, coordinates, colors, names`
          }]
        };
    }

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          type,
          size,
          generatedAt: new Date().toISOString(),
          data: dataset
        }, null, 2)
      }]
    };
  }
);

// ============================================================================
// PROMPTS: Templates for random content generation
// ============================================================================

server.prompt(
  "random-story-starter",
  "Generate a random story starter prompt",
  {
    genre: z.enum(["fantasy", "scifi", "mystery", "romance", "adventure", "horror"])
      .describe("Genre of the story").optional(),
    character: z.string().describe("Main character name").optional(),
  },
  async ({ genre, character }): Promise<GetPromptResult> => {
    const starters = {
      fantasy: [
        "In a world where magic flows through ancient crystals...",
        "The last dragon keeper discovered a hidden prophecy...",
        "When the twin moons aligned, the barrier between worlds...",
      ],
      scifi: [
        "The generation ship had been traveling for 200 years when...",
        "Scientists discovered that time wasn't as linear as...",
        "The first AI to achieve consciousness sent a message...",
      ],
      mystery: [
        "The detective arrived at the scene to find all the clocks...",
        "No one noticed the librarian had been replaced until...",
        "The anonymous letter contained only coordinates and...",
      ],
      romance: [
        "Every morning, she found a new book recommendation in...",
        "The coffee shop regular always ordered the same drink until...",
        "When their flights got cancelled, two strangers...",
      ],
      adventure: [
        "The treasure map was incomplete, but the compass pointed...",
        "Lost in the jungle, they discovered ancient ruins that...",
        "The storm drove them to an uncharted island where...",
      ],
      horror: [
        "The antique music box played a different tune each night...",
        "When they moved into the old house, the previous owner's diary...",
        "The children's laughter echoed from the abandoned school...",
      ]
    };

    const genres = Object.keys(starters) as (keyof typeof starters)[];
    const selectedGenre = genre ?? secureRandomChoice(genres);
    const storyStarters = starters[selectedGenre];
    const randomStarter = secureRandomChoice(storyStarters);

    const characterName = character || "the protagonist";
    const prompt = `${randomStarter} Write a ${selectedGenre} story featuring ${characterName}. Focus on building atmosphere and introducing conflict early in the narrative.`;

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: prompt
        }
      }]
    };
  }
);

server.prompt(
  "random-writing-exercise",
  "Generate a random creative writing exercise",
  {
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("Difficulty level").optional(),
    timeLimit: z.string().describe("Time limit in minutes").optional(),
  },
  async ({ difficulty, timeLimit }): Promise<GetPromptResult> => {
    const exercises = {
      beginner: [
        "Write about your favorite childhood memory using all five senses",
        "Describe a conversation between two objects in your room",
        "Write a letter to yourself from 10 years in the future",
      ],
      intermediate: [
        "Write a story where the main character can only communicate through questions",
        "Create a narrative using only dialogue - no description or action lines",
        "Write from the perspective of an emotion experiencing a human",
      ],
      advanced: [
        "Write a story that reads differently when read backwards",
        "Create a narrative where each paragraph is written in a different literary style",
        "Write a story where the narrator slowly realizes they're unreliable",
      ]
    };

    const usedDifficulty = difficulty ?? "intermediate";
    const exerciseList = exercises[usedDifficulty];
    const randomExercise = secureRandomChoice(exerciseList);

    // Use default time limit of 15 if not provided or invalid
    const timeLimitNum = Number(timeLimit ?? "15");
    const timeLimitDisplay = isNaN(timeLimitNum) ? 15 : timeLimitNum;

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Creative Writing Exercise (${usedDifficulty} - ${timeLimitDisplay} minutes):\n\n${randomExercise}\n\nSet a timer and begin writing immediately. Don't edit as you go - just let your creativity flow!`
        }
      }]
    };
  }
);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  // Use stdio transport for this example
  const transport = new StdioServerTransport();

  console.error("Random Numbers MCP Server starting...");
  console.error("Available tools: random-number, random-decimal, random-choice, shuffle-list, random-string, roll-dice, generate-uuid, random-bytes");
  console.error("Available resources: random://facts/numbers, random://dataset/{type}");
  console.error("Available prompts: random-story-starter, random-writing-exercise");
  console.error("All randomness is cryptographically secure using Node.js crypto module");

  await server.connect(transport);
  console.error("Random Numbers MCP Server running on stdio");
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down Random Numbers MCP Server...');
  await server.close();
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Failed to start Random Numbers MCP Server:", error);
  process.exit(1);
});
