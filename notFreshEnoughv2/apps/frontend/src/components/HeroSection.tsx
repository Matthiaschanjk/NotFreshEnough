import { FishMascot } from "./FishMascot";
import { RepoSubmissionForm } from "./RepoSubmissionForm";

interface HeroSectionProps {
  values: {
    repoUrl: string;
    demoUrl: string;
    submissionUrl: string;
    projectBlurb: string;
  };
  isSubmitting: boolean;
  errorMessage?: string | null;
  onChange: (field: "repoUrl" | "demoUrl" | "submissionUrl" | "projectBlurb", value: string) => void;
  onSubmit: () => void;
}

export function HeroSection({ values, isSubmitting, errorMessage, onChange, onSubmit }: HeroSectionProps) {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
      <div className="max-w-2xl">
        <p className="font-body text-xs uppercase tracking-[0.3em] text-ink/45">Submit for Judgement</p>
        <h2 className="mt-4 font-display text-6xl leading-[0.92] text-ink md:text-7xl">
          Submit for <span className="text-bronze">Judgement</span>
        </h2>
        <p className="mt-6 max-w-xl font-body text-lg leading-8 text-ink/72">
          TinyFish inspects your repo, demo, docs, and whatever other public surface you hand over. Then one click
          summons the whole AI family panel to decide whether your project is actually fresh enough for judges.
        </p>

        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-white/65 p-5 shadow-paper backdrop-blur md:p-6">
          <RepoSubmissionForm
            values={values}
            onChange={onChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[420px] lg:max-w-[460px]">
        <div className="relative rounded-[3rem] bg-gradient-to-br from-white/72 via-parchment to-[#efe2cb] p-8 shadow-paper">
          <div className="absolute inset-0 rounded-[3rem] border border-ink/10" />
          <div className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-gold/18 blur-3xl" />
          <div className="absolute bottom-8 right-0 h-24 w-24 rounded-full bg-sky/25 blur-3xl" />
          <FishMascot className="relative animate-bob" />
        </div>
      </div>
    </section>
  );
}
