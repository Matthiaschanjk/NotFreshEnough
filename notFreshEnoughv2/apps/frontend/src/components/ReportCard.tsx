import type { ReportCardViewModel } from "../lib/reportCardAdapter";

export function ReportCard({ grade, summary, familyHeadline, auntyQuestions }: ReportCardViewModel) {
  const questions = auntyQuestions.length > 0 ? auntyQuestions : ["Aunty is silently disappointed."];

  return (
    <section className="report-card-shell w-full max-w-[900px] rounded-[2.5rem] border-[4px] border-[#e6b44a] bg-[linear-gradient(135deg,#fffbe6_0%,#f9f6ef_60%,#ffe9b3_100%)] p-6 shadow-[0_8px_32px_0_rgba(230,180,74,0.22),0_0_0_6px_#ffe9b3] md:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-display text-4xl uppercase tracking-[0.16em] text-ink md:text-5xl">Report Card</p>
        <p className="mt-2 font-display text-4xl text-cinnabar md:text-5xl">Overall Grade: {grade}</p>
        <p className="mx-auto mt-5 max-w-3xl font-body text-base leading-7 text-ink/78 md:text-lg md:leading-8">{summary}</p>
        <p className="mx-auto mt-3 max-w-3xl font-body text-base leading-7 text-ink/72 md:text-lg md:leading-8">{familyHeadline}</p>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-3xl gap-4">
        {questions.map((question) => (
          <article
            key={question}
            className="rounded-[1.5rem] border-[3px] border-[#e6b44a] bg-[linear-gradient(135deg,#ffe9b3_0%,#f7e2a2_60%,#e6b44a_100%)] px-5 py-6 shadow-[0_4px_24px_0_rgba(230,180,74,0.22),0_0_0_8px_#f7e2a2]"
          >
            <p className="text-center font-display text-2xl leading-8 text-ink">{question}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
