import type { SharedProjectAnalysis } from "../types/judgement";

function severityLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function signalBadgeClasses(signal: "positive" | "negative" | "neutral") {
  if (signal === "positive") {
    return "border-jade/30 bg-jade/10 text-jade";
  }

  if (signal === "negative") {
    return "border-cinnabar/30 bg-cinnabar/10 text-cinnabar";
  }

  return "border-ink/15 bg-white/80 text-ink/55";
}

function cleanExcerpt(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function orderEvidence<T extends { signal: "positive" | "negative" | "neutral" }>(items: T[]) {
  const positives = items.filter((item) => item.signal === "positive");
  const negatives = items.filter((item) => item.signal === "negative");
  const neutrals = items.filter((item) => item.signal === "neutral");

  return [...positives, ...negatives, ...neutrals];
}

export function TinyFishFindings({
  analysis,
  warnings
}: {
  analysis: SharedProjectAnalysis;
  warnings: string[];
}) {
  const sourceLabelMap = new Map(analysis.sourcesInspected.map((source) => [source.id, source.label]));
  const orderedEvidence = orderEvidence(analysis.evidence);

  return (
    <section className="grid gap-6 rounded-[2rem] border border-ink/12 bg-white/78 p-6 shadow-paper md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.28em] text-ink/45">What TinyFish Smelled</p>
          <h3 className="font-display text-4xl text-ink">Evidence and weak signals</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.sourcesInspected.map((source) => (
            <span
              key={source.id}
              className="rounded-full border border-ink/10 bg-oat px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.14em] text-ink/60"
            >
              {source.label}
            </span>
          ))}
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-2xl border border-cinnabar/20 bg-cinnabar/5 p-4 font-body text-sm text-cinnabar">
          {warnings.join(" ")}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-jade/15 bg-jade/5 p-5">
          <h4 className="font-display text-2xl text-jade">Strong points</h4>
          <ul className="mt-4 grid gap-3">
            {analysis.strongPoints.map((point) => (
              <li key={point.title} className="font-body text-sm text-ink/78">
                <span className="font-semibold text-ink">{point.title}.</span> {point.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.5rem] border border-cinnabar/15 bg-cinnabar/5 p-5">
          <h4 className="font-display text-2xl text-cinnabar">Weak points</h4>
          <ul className="mt-4 grid gap-3">
            {analysis.weakPoints.map((point) => (
              <li key={point.title} className="font-body text-sm text-ink/78">
                <span className="font-semibold text-ink">{point.title}.</span> {point.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.5rem] border border-gold/30 bg-gold/10 p-5">
          <h4 className="font-display text-2xl text-ink">Judge concerns</h4>
          <ul className="mt-4 grid gap-3">
            {analysis.judgeConcerns.map((point) => (
              <li key={point.title} className="font-body text-sm text-ink/78">
                <span className="font-semibold text-ink">{point.title}.</span> {point.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {orderedEvidence.map((item) => (
          <article key={item.id} data-testid={`evidence-${item.signal}`} className="rounded-[1.5rem] border border-ink/10 bg-parchment p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-display text-2xl text-ink">{item.title}</h4>
              <span
                className={`rounded-full border px-3 py-1 font-body text-xs font-bold uppercase tracking-[0.12em] ${signalBadgeClasses(
                  item.signal
                )}`}
              >
                {severityLabel(item.signal)}
              </span>
            </div>
            <p className="font-body text-sm leading-6 text-ink/78">{item.detail}</p>
            {item.excerpt ? <p className="mt-3 font-body text-sm italic text-ink/55">“{cleanExcerpt(item.excerpt)}”</p> : null}
            {item.sourceIds.length > 0 ? (
              <p className="mt-3 font-body text-xs uppercase tracking-[0.14em] text-ink/45">
                Sources: {item.sourceIds.map((sourceId) => sourceLabelMap.get(sourceId) ?? sourceId).join(", ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
