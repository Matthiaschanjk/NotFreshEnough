import type OpenAI from "openai";
import { ZodError, type ZodSchema } from "zod";

function extractJsonObject(value: string) {
  const trimmed = value.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Model did not return a JSON object.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

export async function generateJsonCompletion<T>({
  client,
  model,
  schema,
  systemPrompt,
  userPrompt,
  temperature = 0.4
}: {
  client: OpenAI;
  model: string;
  schema: ZodSchema<T>;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<T> {
  const response = await client.chat.completions.create({
    model,
    temperature,
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Model returned an empty response.");
  }

  try {
    return schema.parse(JSON.parse(extractJsonObject(content)));
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Model returned JSON that did not match schema: ${error.message}`);
    }

    throw error;
  }
}
