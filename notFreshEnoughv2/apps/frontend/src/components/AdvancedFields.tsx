interface AdvancedFieldsProps {
  values: {
    demoUrl: string;
    submissionUrl: string;
    projectBlurb: string;
  };
  onChange: (field: "demoUrl" | "submissionUrl" | "projectBlurb", value: string) => void;
}

const FIELD_CLASSNAME =
  "w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 font-body text-sm text-ink outline-none transition focus:border-bronze focus:ring-2 focus:ring-bronze/20";

export function AdvancedFields({ values, onChange }: AdvancedFieldsProps) {
  return (
    <div className="grid gap-3">
      <input
        className={FIELD_CLASSNAME}
        placeholder="Demo URL (optional)"
        type="url"
        value={values.demoUrl}
        onChange={(event) => onChange("demoUrl", event.target.value)}
      />
      <input
        className={FIELD_CLASSNAME}
        placeholder="Submission URL (optional)"
        type="url"
        value={values.submissionUrl}
        onChange={(event) => onChange("submissionUrl", event.target.value)}
      />
      <textarea
        className={`${FIELD_CLASSNAME} min-h-28 resize-y`}
        placeholder="Project blurb (optional)"
        value={values.projectBlurb}
        onChange={(event) => onChange("projectBlurb", event.target.value)}
      />
    </div>
  );
}
