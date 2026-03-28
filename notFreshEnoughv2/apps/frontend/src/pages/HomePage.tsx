import { useEffect, useRef, useState } from "react";
import { judgeProject } from "../lib/api/client";
import { buildSharePayload } from "../lib/share/buildSharePayload";
import { shareResult } from "../lib/share/shareResult";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { LoadingPanel } from "../components/LoadingPanel";
import { ResultsReport } from "../components/ResultsReport";
import type { JudgeProjectRequest, JudgeProjectResponse } from "../types/judgement";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const DEFAULT_FORM: Required<JudgeProjectRequest> = {
  repoUrl: "",
  demoUrl: "",
  submissionUrl: "",
  projectBlurb: ""
};

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidGitHubRepo(value: string) {
  return /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s?#]+/i.test(value);
}

export function HomePage() {
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [result, setResult] = useState<JudgeProjectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (submitStatus === "success" && result) {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [submitStatus, result]);

  function updateField(field: keyof typeof DEFAULT_FORM, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function validateForm() {
    if (!formValues.repoUrl || !isValidGitHubRepo(formValues.repoUrl.trim())) {
      return "Please enter a valid public GitHub repository URL.";
    }

    if (formValues.demoUrl && !isValidUrl(formValues.demoUrl.trim())) {
      return "Demo URL is invalid.";
    }

    if (formValues.submissionUrl && !isValidUrl(formValues.submissionUrl.trim())) {
      return "Submission URL is invalid.";
    }

    return null;
  }

  async function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSubmitStatus("error");
      return;
    }

    setErrorMessage(null);
    setShareMessage(null);
    setSubmitStatus("submitting");

    try {
      const payload = await judgeProject({
        repoUrl: formValues.repoUrl.trim(),
        demoUrl: formValues.demoUrl.trim() || undefined,
        submissionUrl: formValues.submissionUrl.trim() || undefined,
        projectBlurb: formValues.projectBlurb.trim() || undefined
      });

      setResult(payload);
      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage((error as Error).message);
    }
  }

  async function handleShare() {
    if (!result) {
      return;
    }

    setIsSharing(true);
    setShareMessage(null);

    try {
      const outcome = await shareResult(buildSharePayload(result));
      setShareMessage(outcome.message);
    } catch (error) {
      setShareMessage((error as Error).message);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />

      <main className="px-4 pb-10 pt-8 md:px-8 md:pt-10">
        <HeroSection
          values={formValues}
          onChange={updateField}
          onSubmit={handleSubmit}
          isSubmitting={submitStatus === "submitting"}
          errorMessage={submitStatus === "error" ? errorMessage : null}
        />

        {submitStatus === "submitting" ? <LoadingPanel /> : null}

        {submitStatus === "error" && !errorMessage ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-cinnabar/20 bg-cinnabar/5 px-6 py-5 font-body text-cinnabar shadow-paper">
            The family panel hit an unexpected issue.
          </div>
        ) : null}

        {result ? (
          <div ref={resultRef} className="mx-auto mt-12 max-w-6xl">
            <ResultsReport
              result={result}
              onShare={handleShare}
              shareStatusMessage={shareMessage}
              isSharing={isSharing}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
