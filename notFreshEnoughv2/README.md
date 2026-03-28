# NotFreshEnough v2

## Similar Projects Env

Use these variables for `POST /api/similar-projects`:

```bash
GITHUB_TOKEN=ghp_xxx
OPENAI_API_KEY=sk-xxx   # optional embeddings
BING_SEARCH_KEY=xxx     # optional public search for Devpost/LinkedIn discovery
TINYFISH_API_KEY=xxx
TINYFISH_BASE_URL=https://tinyfish.example.com
```

- `GITHUB_TOKEN`: recommended for GitHub metadata, README fetches, and repository search rate limits.
- `OPENAI_API_KEY`: optional; when present the backend uses embeddings for README+description similarity. Without it, a local token cosine fallback is used.
- `BING_SEARCH_KEY`: optional; used for `site:devpost.com` and `site:linkedin.com` discovery when TinyFish search is unavailable.
- `TINYFISH_API_KEY` and `TINYFISH_BASE_URL`: used for the primary TinyFish web-scrape step that collects similar public projects before the backend ranks the top 3.
- Devpost and LinkedIn discovery should only use public, authorized search or polite scraping paths that respect robots rules and platform terms.

## Rate Limits And Safety

- Public data only. The route only processes public GitHub repos and public search results.
- `429` responses are retried with short backoff before failing.
- LinkedIn private APIs are not used. If LinkedIn access is unavailable, the backend falls back to public search-engine discovery or omits that source.
- Respect platform terms and robots rules before expanding the scraping adapters.

## Test Commands

```bash
npm run typecheck
npm test
```
