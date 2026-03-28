import { load } from "cheerio";
import { HttpError } from "../../utils/httpError";

export interface FetchedWebSurface {
  title: string;
  url: string;
  text: string;
  snippet: string;
  headings: string[];
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export async function fetchWebSurface(url: string): Promise<FetchedWebSurface> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "NotFreshEnough/1.0"
    }
  });

  if (!response.ok) {
    throw new HttpError(response.status, `Unable to inspect ${url}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (contentType.includes("html")) {
    const $ = load(body);
    $("script, style, noscript").remove();

    const title = $("title").first().text().trim() || url;
    const text = $("body").text().replace(/\s+/g, " ").trim();
    const headings = $("h1, h2, h3")
      .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 10);

    return {
      title,
      url,
      text: truncate(text, 5000),
      snippet: truncate(text, 420),
      headings
    };
  }

  const text = body.replace(/\s+/g, " ").trim();

  return {
    title: url,
    url,
    text: truncate(text, 5000),
    snippet: truncate(text, 420),
    headings: []
  };
}
