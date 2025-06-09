import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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

// ============================================================================
// DICEWARE UTILITY FUNCTIONS
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate cryptographically secure dice rolls (1-6)
 */
function generateDiceRolls(numDice: number): string {
  let result = "";
  for (let i = 0; i < numDice; i++) {
    result += secureRandomInt(1, 6).toString();
  }
  return result;
}

/**
 * Load and parse a diceware wordlist file
 */
function loadWordlist(filename: string): Map<string, string> {
  const wordlistPath = join(__dirname, "wordlists", filename);
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
function getDiceCount(filename: string): number {
  const diceCountMap: Record<string, number> = {
    "large_wordlist.txt": 5,
    "original_reinhold_wordlist.txt": 5,
    "short_wordlist.txt": 4,
    "short_wordlist_unique_prefixes.txt": 4
  };

  return diceCountMap[filename] ?? 4; // Default to 4 dice if filename not found
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

// Wordlist resources for diceware passphrases
server.resource(
  "wordlist",
  new ResourceTemplate("wordlist://{filename}", {
    list: () => ({
      resources: [
        {
          name: "Short Wordlist",
          uri: "/wordlist/short_wordlist.txt"
        },
        {
          name: "Short Wordlist Unique Prefixes",
          uri: "/wordlist/short_wordlist_unique_prefixes.txt"
        },
        {
          name: "Large Wordlist (EFF)",
          uri: "/wordlist/large_wordlist.txt"
        },
        {
          "name": "Original Reinhold Wordlist",
          "uri": "/wordlists/original_reinhold_wordlist.txt"
        }
      ]
    })
  }),
  async (uri, variables: any): Promise<ReadResourceResult> => {
    const filename = variables?.filename;

    if (!filename) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: Missing filename. Available wordlists: short_wordlist_unique_prefixes.txt, short_wordlist.txt, large_wordlist.txt, original_reinhold_wordlist.txt`
        }]
      };
    }

    const validWordlists = [
      "short_wordlist_unique_prefixes.txt",
      "short_wordlist.txt",
      "large_wordlist.txt",
      "original_reinhold_wordlist.txt"
    ];

    if (!validWordlists.includes(filename)) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: Invalid wordlist "${filename}".Available wordlists: ${validWordlists.join(", ")}`
        }]
      };
    }

    try {
      const wordlistPath = join(__dirname, "wordlists", filename);
      const content = readFileSync(wordlistPath, "utf-8");

      return {
        contents: [{
          uri: uri.href,
          text: content
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error reading wordlist: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Dynamic resource for random datasets
server.resource(
  "random-dataset",
  new ResourceTemplate("random://dataset/{type}", {
    list: () => ({
      resources: [
        {
          name: "Random Numbers Dataset",
          uri: "random://dataset/numbers"
        },
        {
          name: "Random Coordinates Dataset",
          uri: "random://dataset/coordinates"
        },
        {
          name: "Random Colors Dataset",
          uri: "random://dataset/colors"
        },
        {
          name: "Random Names Dataset",
          uri: "random://dataset/names"
        }
      ]
    })
  }),
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
    const prompt = `${randomStarter} Write a ${selectedGenre} story featuring ${characterName}.Focus on building atmosphere and introducing conflict early in the narrative.`;

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
          text: `Creative Writing Exercise(${usedDifficulty} - ${timeLimitDisplay} minutes): \n\n${randomExercise}\n\nSet a timer and begin writing immediately.Don't edit as you go - just let your creativity flow!`
        }
      }]
    };
  }
);

server.prompt(
  "diceware-security-guide",
  "Generate security guidance for diceware passphrase creation and usage",
  {
    context: z.enum(["personal", "business", "high-security"]).describe("Security context").optional(),
    includeStorage: z.string().describe("Include storage recommendations (true/false)").optional(),
  },
  async ({ context, includeStorage = "true" }): Promise<GetPromptResult> => {
    const contextGuidance = {
      personal: {
        words: "4-5 words",
        entropy: "51-64 bits",
        use: "personal accounts, email, social media"
      },
      business: {
        words: "5-6 words",
        entropy: "64-77 bits",
        use: "work accounts, shared systems, team resources"
      },
      "high-security": {
        words: "6-8 words",
        entropy: "77-103 bits",
        use: "cryptocurrency, financial accounts, critical infrastructure"
      }
    };

    const selectedContext = context ?? "personal";
    const guidance = contextGuidance[selectedContext];

    const storageText = includeStorage === "true" ? `

## Secure Storage
- Use a reputable password manager (1Password, Bitwarden, KeePass)
- Never store passphrases in plain text files or notes apps
- Consider writing down critical passphrases and storing in a secure physical location
- Use unique passphrases for each account - never reuse
- Enable two-factor authentication when available` : "";

    const securityTips = [
      "Generate passphrases offline when possible",
      "Verify the randomness source is cryptographically secure",
      "Consider the physical security of your generation environment",
      "Be aware of shoulder surfing when entering passphrases",
      "Use the EFF wordlists which are optimized for security and memorability"
    ];

    const randomTip = secureRandomChoice(securityTips);

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `# Diceware Passphrase Security Guide

## For ${selectedContext} use:
- **Recommended length**: ${guidance.words}
- **Security level**: ~${guidance.entropy} of entropy
- **Typical use cases**: ${guidance.use}

## Security Best Practices
- Always use cryptographically secure randomness (like this MCP server)
- Choose words from established wordlists (EFF recommended)
- Consider capitalization for additional entropy if needed
- Add numbers or symbols only if required by password policies

${storageText}

## Pro Tip
${randomTip}

Generate your secure passphrase using the diceware-passphrase tool with appropriate parameters for your security context.`
        }
      }]
    };
  }
);

server.prompt(
  "password-policy-advisor",
  "Generate advice for creating password policies that accommodate diceware passphrases",
  {
    organization: z.enum(["small-business", "enterprise", "government", "education"]).describe("Organization type").optional(),
    compliance: z.string().describe("Compliance requirements (comma-separated: NIST,ISO27001,HIPAA,PCI-DSS,SOX)").optional(),
  },
  async ({ organization, compliance }): Promise<GetPromptResult> => {
    const orgGuidance = {
      "small-business": {
        focus: "balance security with usability",
        recommendations: "4-5 word passphrases, password manager adoption"
      },
      enterprise: {
        focus: "scalable security policies",
        recommendations: "5-6 word passphrases, centralized password management"
      },
      government: {
        focus: "high security standards",
        recommendations: "6+ word passphrases, strict generation and storage protocols"
      },
      education: {
        focus: "security education and ease of use",
        recommendations: "4-5 word passphrases, security awareness training"
      }
    };

    const selectedOrg = organization ?? "small-business";
    const orgInfo = orgGuidance[selectedOrg];

    const complianceArray = compliance ? compliance.split(",").map(c => c.trim()) : [];
    const complianceText = complianceArray.length > 0 ? `

## Compliance Considerations (${complianceArray.join(", ")})
- Document your passphrase generation methodology
- Ensure cryptographic randomness meets regulatory standards
- Implement proper audit trails for password changes
- Consider entropy requirements specified in relevant frameworks` : "";

    const policyElements = [
      "Minimum passphrase length in words rather than characters",
      "Acceptance of spaces in passwords (critical for diceware)",
      "Reduced or eliminated forced password rotation",
      "Focus on unique passwords rather than complex character requirements",
      "User education on passphrase generation and storage"
    ];

    const randomElement = secureRandomChoice(policyElements);

    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `# Password Policy Guidance for Diceware Implementation

## Organization Profile: ${selectedOrg}
**Focus**: ${orgInfo.focus}
**Recommendations**: ${orgInfo.recommendations}

## Diceware-Friendly Policy Elements

### Length Requirements
- Specify minimum in words (4-6 words) rather than characters
- Allow passphrases up to 128+ characters to accommodate longer diceware phrases
- Remove maximum length restrictions that might block secure passphrases

### Character Requirements  
- Allow spaces and standard punctuation
- Reduce or eliminate complex character requirements (numbers, symbols)
- Focus on entropy through length rather than character complexity

### Rotation and Reuse
- Extend password rotation periods (annually vs quarterly)
- Prohibit password reuse across different systems
- Allow password updates for security incidents only

### Implementation Recommendations
- Provide diceware generation tools or approved methods
- Mandate password manager usage for storage
- Include passphrase creation in security training

## Key Policy Element to Consider
${randomElement}

${complianceText}

Use this guidance to create policies that embrace the security benefits of diceware passphrases while meeting your organizational needs.`
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
  console.error("Available tools: random-number, random-decimal, random-choice, shuffle-list, random-string, roll-dice, generate-uuid, random-bytes, diceware-passphrase");
  console.error("Available resources: random://facts/numbers, resource templates for datasets and wordlists");
  console.error("Available prompts: random-story-starter, random-writing-exercise, diceware-security-guide, password-policy-advisor");
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
