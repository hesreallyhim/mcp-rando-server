import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerWordlistResources(server: McpServer): void {
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
        const wordlistPath = join(__dirname, "..", "wordlists", filename);
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
}