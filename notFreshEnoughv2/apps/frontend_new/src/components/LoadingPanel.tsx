import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "TinyFish is sniffing your repo...",
  "TinyFish is checking if your commits are stale...",
  "Aunty is sharpening her questions...",
  "Ah Gong is preparing your report card...",
  "Korkor is already judging your life choices...",
  "The family is deciding whether this can be shown in public..."
];

export function LoadingPanel() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1800);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        const next = current + Math.random() * 9;
        return next > 94 ? 94 : next;
      });
    }, 520);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

  return (
    <section className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-ink/10 bg-white/55 px-6 py-10 text-center shadow-paper backdrop-blur md:px-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
        <div className="sparkle" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="grid gap-2">
          <p className="font-display text-3xl text-ink md:text-4xl">Generating judgement...</p>
          <p className="font-body text-base text-ink/70">{LOADING_MESSAGES[messageIndex]}</p>
        </div>
        <div className="w-full max-w-md">
          <div className="progress-shell h-12 rounded-full p-1">
            <div
              className="progress-bar h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
