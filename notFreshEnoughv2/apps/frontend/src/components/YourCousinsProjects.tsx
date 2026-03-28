import type { SimilarProjectsResponse } from "../types/similarProjects";
import { buildComparisonRows, generateReportCard } from "../lib/similarProjects/comparison";

export function YourCousinsProjects({
  data,
  isLoading,
  errorMessage
}: {
  data: SimilarProjectsResponse | null;
  isLoading: boolean;
  errorMessage?: string | null;
}) {
  const reportCard = data ? generateReportCard(data) : null;
  const isOriginalOnly = Boolean(data && data.project_status === "original_project" && data.results.length === 0);

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-paper">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Your Cousin&apos;s Projects</p>
          <h3 className="font-display text-3xl text-ink">Your Cousin&apos;s Projects</h3>
          <p className="mt-2 max-w-2xl font-body text-sm leading-6 text-ink/70">
            Similar public repositories discovered across GitHub, Devpost, and safe public search paths, then ranked
            by README similarity, language overlap, topic overlap, and popularity.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/15 bg-oat/50 p-5 font-body text-sm text-ink/65">
          Searching public project sources for closely related repositories...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-[1.5rem] border border-cinnabar/20 bg-cinnabar/5 p-5 font-body text-sm text-cinnabar">
          {errorMessage}
        </div>
      ) : null}

      {data ? (
        <div className="mt-6 grid gap-6">
          <div className="rounded-[1.5rem] border border-ink/10 bg-white/72 p-5">
            <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Input Repository</p>
            <a
              href={data.input_repo.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block font-display text-3xl text-ink underline decoration-bronze/50 underline-offset-4"
            >
              {data.input_repo.full_name}
            </a>
            <p className="mt-2 font-body text-sm leading-6 text-ink/72">{data.input_repo.description}</p>
            {!isOriginalOnly ? <p className="mt-3 font-body text-sm leading-6 text-ink/62">{data.message}</p> : null}
          </div>

          {isOriginalOnly ? (
            <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-400/35 bg-gradient-to-r from-emerald-50 to-amber-50 p-5">
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <span className="absolute left-[8%] top-[18%] text-lg animate-bounce">🎉</span>
                <span className="absolute left-[24%] top-[64%] text-base animate-pulse">✨</span>
                <span className="absolute left-[48%] top-[12%] text-lg animate-bounce">🎊</span>
                <span className="absolute left-[72%] top-[58%] text-base animate-pulse">✨</span>
                <span className="absolute left-[88%] top-[22%] text-lg animate-bounce">🎉</span>
              </div>
              <p className="relative font-body text-xs uppercase tracking-[0.18em] text-emerald-700/80">Original Project</p>
              <p className="relative mt-2 font-display text-3xl text-emerald-800">Congratulations!</p>
              <p className="relative mt-2 font-body text-sm leading-6 text-emerald-900/85">
                This repository is being recognized as an original project idea. Good job building something distinct.
              </p>
            </div>
          ) : null}

          {data.results.map((result, index) => {
            const rows = buildComparisonRows(data.input_repo, result);
            return (
              <article key={result.full_name} className="rounded-[1.5rem] border border-ink/10 bg-parchment/55 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Cousin #{index + 1}</p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-display text-3xl text-ink underline decoration-bronze/50 underline-offset-4"
                    >
                      {result.full_name}
                    </a>
                    <p className="mt-3 max-w-3xl font-body text-sm leading-6 text-ink/75">{result.description}</p>
                  </div>
                  <div className="rounded-2xl bg-white/75 px-4 py-3 text-right shadow-sm">
                    <p className="font-body text-xs uppercase tracking-[0.16em] text-ink/45">Similarity Score</p>
                    <p className="font-display text-4xl text-cinnabar">{result.similarity_score.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-ink/10">
                  <table className="w-full border-collapse font-body text-sm">
                    <thead className="bg-white/75 text-left text-ink/60">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Feature</th>
                        <th className="px-4 py-3 font-semibold">Input repo</th>
                        <th className="px-4 py-3 font-semibold">Cousin repo</th>
                        <th className="px-4 py-3 font-semibold">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={`${result.full_name}-${row.label}`} className="border-t border-ink/10 align-top">
                          <td className="px-4 py-3 font-semibold text-ink">{row.label}</td>
                          <td className="px-4 py-3 text-ink/72">{row.inputValue}</td>
                          <td className="px-4 py-3 text-ink/72 capitalize">{row.candidateValue}</td>
                          <td className="px-4 py-3 text-ink/72">{row.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {reportCard ? (
                  <p className="mt-4 font-body text-sm leading-6 text-ink/72">{reportCard.repoParagraphs[index]}</p>
                ) : null}
              </article>
            );
          })}

          {data.results.length > 0 ? (
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/72 p-5">
              <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Overall judgement</p>
              <p className="mt-2 font-body text-base leading-7 text-ink/78">{reportCard?.overallJudgement}</p>
              <div className="mt-3 grid gap-2 font-body text-sm leading-6 text-ink/72">
                {reportCard?.exampleLines.map((line) => <p key={line}>{line}</p>)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
