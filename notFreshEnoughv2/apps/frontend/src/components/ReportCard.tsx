import type { ReportCardViewModel } from "../lib/reportCardAdapter";

const REPORT_CARD_FALLBACKS = [
  "Judge-facing clarity: differentiation is not explicit, which may make the project less memorable during short evaluation windows.",
  "Technical robustness: limited implementation vocabulary and technical surface details were found.",
  "Demo and onboarding: a live surface exists but lacks step-by-step context for quick evaluation."
];

function normalizeItem(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function detectCategory(value: string) {
  if (/judge-facing/i.test(value)) return "judge";
  if (/technical robustness/i.test(value)) return "technical";
  if (/demo|onboarding/i.test(value)) return "demo";
  return "other";
}

function ensureSentence(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return normalized;
  }

  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function neutralizeGoldCardText(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const sentences =
    normalized.match(/[^.!?]+[.!?]/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [ensureSentence(normalized)];
  const category = detectCategory(normalized);

  if (category === "judge") {
    return "Judge-facing clarity: differentiation is not explicit, which may make the project less memorable during short evaluation windows.";
  }

  if (category === "technical") {
    return "Technical robustness: limited implementation vocabulary and technical surface details were found.";
  }

  if (category === "demo") {
    return "Demo and onboarding: a live surface exists but lacks step-by-step context for quick evaluation.";
  }

  const firstNonImperative =
    sentences.find((sentence) => !/^(Add|Place|Put|Document|Show|Move|Make|Ship)\b/i.test(sentence)) ?? sentences[0];

  return ensureSentence(firstNonImperative);
}

function compressReportItem(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return normalized;
  }

  return neutralizeGoldCardText(normalized);
}

function buildDistinctItems(items: string[], fallbacks: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  let judgeCount = 0;

  for (const item of [...items, ...fallbacks]) {
    const compact = compressReportItem(item.trim());
    const normalized = normalizeItem(compact);
    const category = detectCategory(compact);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    if (category === "judge" && judgeCount >= 1) {
      continue;
    }

    seen.add(normalized);
    if (category === "judge") {
      judgeCount += 1;
    }
    output.push(compact);

    if (output.length === 3) {
      break;
    }
  }

  return output;
}

export function ReportCard({ grade, summary, familyHeadline: _familyHeadline, auntyQuestions }: ReportCardViewModel) {
  const questions = buildDistinctItems(auntyQuestions, REPORT_CARD_FALLBACKS);

  return (
    <section className="report-card-shell w-full max-w-[900px] rounded-[2.5rem] border-[4px] border-[#e6b44a] bg-[linear-gradient(135deg,#fffbe6_0%,#f9f6ef_60%,#ffe9b3_100%)] p-6 shadow-[0_8px_32px_0_rgba(230,180,74,0.22),0_0_0_6px_#ffe9b3] md:p-8">
      <div className="mx-auto max-w-[48rem] text-center">
        <p className="font-display text-4xl uppercase tracking-[0.16em] text-ink md:text-5xl">Report Card</p>
        <p className="mt-2 font-display text-4xl text-cinnabar md:text-5xl">Overall Grade: {grade}</p>
        <p className="mx-auto mt-5 max-w-[44rem] font-body text-base leading-7 text-ink/78 md:text-lg md:leading-8">{summary}</p>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-[46rem] gap-4">
        {questions.map((question) => (
          <article
            key={question}
            data-testid="report-card-item"
            className="rounded-[1.5rem] border-[3px] border-[#e6b44a] bg-[linear-gradient(135deg,#ffe9b3_0%,#f7e2a2_60%,#e6b44a_100%)] px-5 py-5 shadow-[0_4px_24px_0_rgba(230,180,74,0.22),0_0_0_8px_#f7e2a2] md:px-6"
          >
            <p className="mx-auto max-w-[38rem] text-center font-body text-lg leading-7 text-ink md:text-[1.15rem]">
              {question}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
