import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRandomTools } from "./tools/random.js";
import { registerStringTools } from "./tools/string.js";
import { registerDiceTools } from "./tools/dice.js";
import { registerCryptoTools } from "./tools/crypto.js";
import { registerDicewareTools } from "./tools/diceware.js";
import { registerFactsResources } from "./resources/facts.js";
import { registerWordlistResources } from "./resources/wordlists.js";
import { registerDatasetResources } from "./resources/datasets.js";
import { registerCreativePrompts } from "./prompts/creative.js";
import { registerSecurityPrompts } from "./prompts/security.js";



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

// Register all resource modules
registerFactsResources(server);
registerWordlistResources(server);
registerDatasetResources(server);

// ============================================================================
// PROMPTS: Templates for random content generation
// ============================================================================

// Register all prompt modules
registerCreativePrompts(server);
registerSecurityPrompts(server);

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
