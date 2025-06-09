import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { secureRandomChoice } from "../utils/crypto.js";

export function registerCreativePrompts(server: McpServer): void {
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
}