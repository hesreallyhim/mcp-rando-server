import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { CallToolResult, GetPromptResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { secureRandomInt, secureRandomFloat, secureArrayShuffle, secureRandomChoice } from "./utils/crypto.js";
import { generateDiceRolls, loadWordlist, getDiceCount } from "./utils/diceware.js";
import { registerRandomTools } from "./tools/random.js";
import { registerStringTools } from "./tools/string.js";
import { registerDiceTools } from "./tools/dice.js";
import { registerCryptoTools } from "./tools/crypto.js";
import { registerDicewareTools } from "./tools/diceware.js";



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

// Register basic random tools
registerRandomTools(server);

// Register string tools
registerStringTools(server);

// Register dice tools
registerDiceTools(server);

// Register crypto tools
registerCryptoTools(server);

// Register diceware tools
registerDicewareTools(server);

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

// ============================================================================
// RESOURCES: Pre-generated random data
// ============================================================================

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
