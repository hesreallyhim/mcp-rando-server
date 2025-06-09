import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { randomBytes } from "node:crypto";
import { secureRandomInt, secureRandomFloat, secureRandomChoice } from "../utils/crypto.js";

export function registerDatasetResources(server: McpServer): void {
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
}