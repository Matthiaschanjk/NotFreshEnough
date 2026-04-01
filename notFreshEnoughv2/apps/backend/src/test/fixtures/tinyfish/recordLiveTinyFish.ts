import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const outputUrl = new URL("./recorded-search-results.json", import.meta.url);

async function main() {
  const baseUrl = process.env.TINYFISH_BASE_URL?.replace(/\/$/, "") ?? "https://agent.tinyfish.ai/v1";
  const apiKey = process.env.TINYFISH_API_KEY;

  if (!apiKey) {
    throw new Error("TINYFISH_API_KEY is required to record a live TinyFish fixture.");
  }

  const response = await fetch(`${baseUrl}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      queries: ["ai judging repo", "hackathon demo README", "repository evaluation workflow"],
      sources: ["github", "devpost", "linkedin"],
      max_results: 20,
      blacklist: [],
      options: {
        respect_robots: true,
        rate_limit_per_host: 2,
        user_agent: "NotFreshEnough/1.0"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`TinyFish fixture recording failed with ${response.status}.`);
  }

  const payload = await response.text();
  await mkdir(dirname(outputUrl.pathname), { recursive: true });
  await writeFile(outputUrl, payload, "utf8");
  console.log(`Saved TinyFish fixture to ${outputUrl.pathname}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
