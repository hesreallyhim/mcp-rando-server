import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomBytes, randomUUID } from "node:crypto";

export function registerCryptoTools(server: McpServer): void {
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
}