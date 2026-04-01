import type { SimilarProjectsResponse } from "../types/similarProjects";
import { buildComparisonRows, generateReportCard } from "../lib/similarProjects/comparison";

const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;

function stripEmojis(value: string | undefined) {
  return (value ?? "").replace(EMOJI_REGEX, "");
}

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
            Similar public repositories discovered across GitHub, Devpost and Linkedin
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
            <p className="mt-2 font-body text-sm leading-6 text-ink/72">{stripEmojis(data.input_repo.description)}</p>
            {!isOriginalOnly ? <p className="mt-3 font-body text-sm leading-6 text-ink/62">{stripEmojis(data.message)}</p> : null}
          </div>

          {isOriginalOnly ? (
            <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-400/35 bg-gradient-to-r from-emerald-50 to-amber-50 p-5">
              <p className="relative font-body text-xs uppercase tracking-[0.18em] text-emerald-700/80">Original Project</p>
              <p className="relative mt-2 font-display text-3xl text-emerald-800">Congratulations!</p>
              <p className="relative mt-2 font-body text-sm leading-6 text-emerald-900/85">
                This repository is being recognized as an original project idea. Good job building something distinct.
              </p>
            </div>
          ) : null}

          {data.results.map((result, index) => {
            const rows = buildComparisonRows(data.input_repo, result);
            const resultLabel = result.full_name ?? result.url.replace(/^https?:\/\//, "");
            return (
              <article key={`${result.url}-${index}`} className="rounded-[1.5rem] border border-ink/10 bg-parchment/55 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">
                      Cousin #{index + 1} · {result.source}
                    </p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-display text-3xl text-ink underline decoration-bronze/50 underline-offset-4"
                    >
                      {resultLabel}
                    </a>
                    <p className="mt-3 max-w-3xl font-body text-sm leading-6 text-ink/75">{stripEmojis(result.one_line_description)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/75 px-4 py-3 text-center shadow-sm">
                    <p className="font-body text-xs uppercase tracking-[0.16em] text-ink/45">Similarity Score</p>
                    <p className="font-display text-4xl text-cinnabar text-center">{result.similarity_score.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-ink/10">
                  <table className="comparison-table w-full border-collapse font-body text-sm max-md:block" role="table">
                    <thead className="bg-white/75 text-left text-ink/60 max-md:hidden">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Feature</th>
                        <th className="px-4 py-3 font-semibold">Input repo</th>
                        <th className="px-4 py-3 font-semibold">Cousin repo</th>
                        <th className="px-4 py-3 font-semibold">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="max-md:block">
                      {rows.map((row) => {
                        const isMergedRow = Boolean(row.merged);

                        return (
                          <tr
                            key={`${result.url}-${row.feature}`}
                            className="border-t border-ink/10 align-top max-md:block max-md:px-4 max-md:py-3"
                          >
                            <td className="px-4 py-3 font-semibold text-ink max-md:block max-md:px-0 max-md:py-1">{row.feature}</td>
                            {isMergedRow ? (
                              <td
                                colSpan={3}
                                className="assessment assessment-cell core-differences px-4 py-3 text-ink/72 max-md:block max-md:px-0 max-md:py-1"
                              >
                                <span className="mr-1 hidden font-semibold text-ink/60 max-md:inline">Assessment:</span>
                                <span className="cell-summary">{stripEmojis(row.mergedAssessment)}</span>
                              </td>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-ink/72 max-md:block max-md:px-0 max-md:py-1">
                                  <span className="mr-1 hidden font-semibold text-ink/60 max-md:inline">Input repo:</span>
                                  <span className="cell-summary">{stripEmojis(row.inputRepo)}</span>
                                </td>
                                <td className="px-4 py-3 text-ink/72 max-md:block max-md:px-0 max-md:py-1">
                                  <span className="mr-1 hidden font-semibold text-ink/60 max-md:inline">Cousin repo:</span>
                                  <span className="cell-summary">{stripEmojis(row.cousinRepo)}</span>
                                </td>
                                <td className="assessment px-4 py-3 text-ink/72 max-md:block max-md:px-0 max-md:py-1">
                                  <span className="mr-1 hidden font-semibold text-ink/60 max-md:inline">Assessment:</span>
                                  <span className="cell-summary">{stripEmojis(row.assessment)}</span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {reportCard ? (
                  <p className="mt-4 font-body text-sm leading-6 text-ink/72">{stripEmojis(reportCard.repoParagraphs[index])}</p>
                ) : null}
              </article>
            );
          })}

          {data.results.length > 0 ? (
            <div className="rounded-[1.5rem] border border-ink/10 bg-white/72 p-5">
              <p className="font-body text-xs uppercase tracking-[0.18em] text-ink/45">Overall judgement</p>
              <p className="mt-2 font-body text-base leading-7 text-ink/78">{stripEmojis(reportCard?.overallJudgement)}</p>
              <div className="mt-3 grid gap-2 font-body text-sm leading-6 text-ink/72">
                {reportCard?.exampleLines.map((line) => <p key={line}>{stripEmojis(line)}</p>)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
