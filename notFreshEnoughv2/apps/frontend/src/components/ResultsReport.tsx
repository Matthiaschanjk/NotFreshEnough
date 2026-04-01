import type { JudgeProjectResponse, PersonaEnvelope } from "../types/judgement";
import type { SimilarProjectsResponse } from "../types/similarProjects";
import { buildReportCardViewModel } from "../lib/reportCardAdapter";
import { PersonaBlock } from "./PersonaBlock";
import { ReportCard } from "./ReportCard";
import { ShareSection } from "./ShareSection";
import { TinyFishFindings } from "./TinyFishFindings";
import { YourCousinsProjects } from "./YourCousinsProjects";

const RECOMMENDATION_FALLBACKS = [
  {
    priority: 1 as const,
    issue: "Technical robustness",
    whyItMatters: "Implementation strength is not yet easy to verify from the public materials.",
    concreteAction: "Document the architecture and one reproducible run path in the README."
  },
  {
    priority: 2 as const,
    issue: "Demo and onboarding",
    whyItMatters: "A faster first-run path would make the product value easier to validate.",
    concreteAction: "Add a visible demo link or a 60-second walkthrough near the top of the repo."
  },
  {
    priority: 3 as const,
    issue: "Suggested improvement",
    whyItMatters: "One more proof artifact would reduce ambiguity around the main claim.",
    concreteAction: "Add screenshots, expected outputs, or a short example flow to the public materials."
  }
];

function normalizeRecommendation(
  recommendation: { issue: string; whyItMatters: string; concreteAction: string }
) {
  return `${recommendation.issue} ${recommendation.whyItMatters} ${recommendation.concreteAction}`
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildDistinctRecommendations(
  recommendations: Array<{ priority: 1 | 2 | 3; issue: string; whyItMatters: string; concreteAction: string }>
) {
  const seen = new Set<string>();
  const output: typeof recommendations = [];

  for (const recommendation of [...recommendations, ...RECOMMENDATION_FALLBACKS]) {
    const normalized = normalizeRecommendation(recommendation);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push({
      ...recommendation,
      priority: (output.length + 1) as 1 | 2 | 3
    });

    if (output.length === 3) {
      break;
    }
  }

  return output;
}

function ScoreRail({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between font-body text-xs uppercase tracking-[0.18em] text-ink/48">
        <span>{label}</span>
        <span>{value.toFixed(1)}/10</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bronze via-gold to-jade"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function PersonaMeta({ envelope }: { envelope: PersonaEnvelope<unknown> }) {
  if (envelope.status === "error") {
    return <p className="font-body text-sm text-cinnabar">{envelope.error?.message ?? "This relative refused to speak."}</p>;
  }

  if (envelope.source === "fallback") {
    return <p className="font-body text-xs uppercase tracking-[0.16em] text-ink/35">Rule-based fallback mode</p>;
  }

  return null;
}

export function ResultsReport({
  result,
  similarProjects,
  isLoadingSimilarProjects,
  similarProjectsError,
  onShare,
  shareStatusMessage,
  isSharing
}: {
  result: JudgeProjectResponse;
  similarProjects: SimilarProjectsResponse | null;
  isLoadingSimilarProjects: boolean;
  similarProjectsError?: string | null;
  onShare: () => void;
  shareStatusMessage?: string | null;
  isSharing: boolean;
}) {
  const reportCard = buildReportCardViewModel(result);
  const ahGong = result.panel.ahGong.data;
  const recommendations = buildDistinctRecommendations(result.panel.korkorRecommendations.data?.recommendations ?? []);
  const verdictCopy =
    result.panel.statusLabel === "PASS" ? "You have not disappointed your family." : "You have disappointed your family.";

  return (
    <section className="report-area mx-auto flex w-full max-w-[900px] flex-col items-center gap-6">
      <ReportCard {...reportCard} />

      <div className="w-full rounded-[1.75rem] border border-ink/10 bg-white/72 p-6 shadow-paper">
        <div className="mb-5 flex flex-wrap items-center gap-5">
          <div
            className={`stamp-button inline-flex min-w-44 items-center justify-center rounded-2xl border-4 px-8 py-5 font-body text-4xl font-extrabold uppercase tracking-[0.18em] text-white ${
              result.panel.statusLabel === "PASS" ? "border-jade bg-jade" : "border-cinnabar bg-[#f2120a]"
            }`}
          >
            {result.panel.statusLabel}
          </div>
          <div>
            <p className="font-body text-xl text-ink">{verdictCopy}</p>
            {ahGong ? <p className="mt-2 font-body text-base italic text-ink/60">{ahGong.closingLine}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ScoreRail label="Clarity" value={result.analysis.scores.clarity} />
          <ScoreRail label="Completeness" value={result.analysis.scores.completeness} />
          <ScoreRail label="Differentiation" value={result.analysis.scores.differentiation} />
          <ScoreRail label="Usability" value={result.analysis.scores.usability} />
          <ScoreRail label="Technical Depth" value={result.analysis.scores.technicalDepth} />
          <ScoreRail label="Freshness" value={result.analysis.scores.freshness} />
        </div>
      </div>

      <div className="w-full grid gap-6">
        <PersonaBlock title="Ah Gong's Verdict" subtitle="Ah Gong: final family verdict">
          <PersonaMeta envelope={result.panel.ahGong} />
          {ahGong ? (
            <div className="grid gap-3">
              <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Verdict</p>
              <p className="font-display text-4xl text-cinnabar">{ahGong.verdict}</p>
              <p className="font-body text-base leading-7 text-ink/78">{ahGong.explanation}</p>
            </div>
          ) : null}
        </PersonaBlock>

        <PersonaBlock title="Korkor's Recommendations" subtitle="Korkor: older sibling who knows how to fix it">
          <div className="grid gap-4">
            {recommendations.map((recommendation) => (
              <article
                key={recommendation.priority}
                data-testid="korkor-recommendation"
                className="rounded-[1.5rem] border border-ink/10 bg-oat/65 p-5"
              >
                <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Priority {recommendation.priority}</p>
                <h4 className="mt-2 font-display text-3xl text-ink">{recommendation.issue}</h4>
                <p className="mt-3 font-body text-sm leading-6 text-ink/72">
                  <span className="font-semibold text-ink">Why it matters:</span> {recommendation.whyItMatters}
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-ink/72">
                  <span className="font-semibold text-ink">Concrete action:</span> {recommendation.concreteAction}
                </p>
              </article>
            ))}
          </div>
        </PersonaBlock>
      </div>

      <div className="w-full grid gap-6">
        <YourCousinsProjects
          data={similarProjects}
          isLoading={isLoadingSimilarProjects}
          errorMessage={similarProjectsError}
        />

        <TinyFishFindings analysis={result.analysis} warnings={result.tinyFish.warnings} />
      </div>

      <ShareSection onShare={onShare} statusMessage={shareStatusMessage} isSharing={isSharing} />
    </section>
  );
}
