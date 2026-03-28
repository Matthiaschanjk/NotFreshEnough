import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { AdvancedFields } from "./AdvancedFields";

interface RepoSubmissionFormProps {
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

const INPUT_CLASSNAME =
  "min-w-0 flex-1 rounded-2xl border border-ink/18 bg-white/88 px-4 py-3 font-body text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-bronze focus:ring-2 focus:ring-bronze/20";

export function RepoSubmissionForm({ values, isSubmitting, errorMessage, onChange, onSubmit }: RepoSubmissionFormProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(Boolean(values.demoUrl || values.submissionUrl || values.projectBlurb));

  useEffect(() => {
    if (values.demoUrl || values.submissionUrl || values.projectBlurb) {
      setIsAdvancedOpen(true);
    }
  }, [values.demoUrl, values.projectBlurb, values.submissionUrl]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className={INPUT_CLASSNAME}
          type="url"
          placeholder="Paste your GitHub repo here"
          value={values.repoUrl}
          onChange={(event) => onChange("repoUrl", event.target.value)}
          aria-label="GitHub repository URL"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-ink bg-gold px-7 font-body text-sm font-extrabold uppercase tracking-[0.22em] text-ink transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Sparkles className="h-4 w-4" />
          {isSubmitting ? "Judging..." : "Get Judged"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink/68">
          TinyFish will inspect the repo once, then the whole family judges from the same evidence.
        </p>
        <button
          type="button"
          onClick={() => setIsAdvancedOpen((current) => !current)}
          className="inline-flex items-center gap-2 font-body text-sm font-semibold text-bronze"
        >
          Advanced
          <ChevronDown className={`h-4 w-4 transition ${isAdvancedOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isAdvancedOpen ? (
        <AdvancedFields
          values={{
            demoUrl: values.demoUrl,
            submissionUrl: values.submissionUrl,
            projectBlurb: values.projectBlurb
          }}
          onChange={onChange}
        />
      ) : null}

      {errorMessage ? <p className="font-body text-sm font-semibold text-cinnabar">{errorMessage}</p> : null}
    </div>
  );
}
