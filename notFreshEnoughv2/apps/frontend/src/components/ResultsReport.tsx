import type { JudgeProjectResponse, PersonaEnvelope } from "../types/judgement";
import type { SimilarProjectsResponse } from "../types/similarProjects";
import { PersonaBlock } from "./PersonaBlock";
import { ShareSection } from "./ShareSection";
import { TinyFishFindings } from "./TinyFishFindings";
import { YourCousinsProjects } from "./YourCousinsProjects";

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
  const auntyQuestions = result.panel.aunty.data?.questions ?? [];
  const ahGong = result.panel.ahGong.data;
  const recommendations = result.panel.korkorRecommendations.data?.recommendations ?? [];
  const failCopy =
    result.panel.statusLabel === "FAIL" ? "You have disappointed your family." : "The family has stopped whispering for now.";

  return (
    <section className="grid gap-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:items-start">
        <aside className="paper-panel paper-noise rounded-[2.5rem] p-6 md:p-8">
          <div className="space-y-2 text-center">
            <p className="font-display text-4xl uppercase tracking-[0.16em] text-ink md:text-5xl">Report Card</p>
            <p className="font-body text-xs uppercase tracking-[0.35em] text-ink/45">Aunty&apos;s Questions</p>
            <p className="font-display text-4xl text-cinnabar md:text-5xl">Overall Grade: {result.analysis.scores.overallGrade}</p>
          </div>

          <div className="mt-8 grid gap-4">
            {auntyQuestions.map((question) => (
              <div key={question} className="report-plaque rounded-[1.75rem] px-6 py-8 text-center">
                <p className="font-display text-2xl leading-8 text-ink">{question}</p>
              </div>
            ))}
            {auntyQuestions.length === 0 ? (
              <div className="report-plaque rounded-[1.75rem] px-6 py-8 text-center">
                <p className="font-display text-2xl leading-8 text-ink">Aunty is silently disappointed.</p>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="grid gap-6">
          <div className="space-y-4">
            <p className="font-body text-xs uppercase tracking-[0.32em] text-ink/45">Report Card</p>
            <h2 className="font-display text-5xl text-ink md:text-6xl">Overall Grade: {result.analysis.scores.overallGrade}</h2>
            <p className="max-w-3xl font-body text-lg leading-8 text-ink/78">{result.analysis.summary}</p>
            <p className="max-w-3xl font-body text-lg leading-8 text-ink/72">{result.panel.familyHeadline}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div
              className={`stamp-button inline-flex min-w-44 items-center justify-center rounded-2xl border-4 px-8 py-5 font-body text-4xl font-extrabold uppercase tracking-[0.18em] text-white ${
                result.panel.statusLabel === "PASS" ? "border-jade bg-jade" : "border-cinnabar bg-[#f2120a]"
              }`}
            >
              {result.panel.statusLabel}
            </div>
            <div>
              <p className="font-body text-xl text-ink">{failCopy}</p>
              {ahGong ? <p className="mt-2 font-body text-base italic text-ink/60">{ahGong.closingLine}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-ink/10 bg-white/72 p-6 shadow-paper md:grid-cols-2">
            <ScoreRail label="Clarity" value={result.analysis.scores.clarity} />
            <ScoreRail label="Completeness" value={result.analysis.scores.completeness} />
            <ScoreRail label="Differentiation" value={result.analysis.scores.differentiation} />
            <ScoreRail label="Usability" value={result.analysis.scores.usability} />
            <ScoreRail label="Technical Depth" value={result.analysis.scores.technicalDepth} />
            <ScoreRail label="Freshness" value={result.analysis.scores.freshness} />
          </div>

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
            <PersonaMeta envelope={result.panel.korkorRecommendations} />
            <div className="grid gap-4">
              {recommendations.map((recommendation) => (
                <article key={recommendation.priority} className="rounded-[1.5rem] border border-ink/10 bg-oat/65 p-5">
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

          <YourCousinsProjects
            data={similarProjects}
            isLoading={isLoadingSimilarProjects}
            errorMessage={similarProjectsError}
          />
        </div>
      </div>

      <TinyFishFindings analysis={result.analysis} warnings={result.tinyFish.warnings} />
      <ShareSection onShare={onShare} statusMessage={shareStatusMessage} isSharing={isSharing} />
    </section>
  );
}
