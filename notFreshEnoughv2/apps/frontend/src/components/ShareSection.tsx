import { Share2 } from "lucide-react";

interface ShareSectionProps {
  onShare: () => void;
  statusMessage?: string | null;
  isSharing: boolean;
}

export function ShareSection({ onShare, statusMessage, isSharing }: ShareSectionProps) {
  return (
    <section className="rounded-[2rem] border border-ink/12 bg-white/78 px-6 py-7 text-center shadow-paper">
      <p className="font-display text-3xl text-ink">Share your Shame</p>
      <p className="mt-2 font-body text-sm text-ink/62">
        Send it to the group chat before someone else points out the stale bits first.
      </p>

      <button
        type="button"
        onClick={onShare}
        disabled={isSharing}
        className="mt-6 inline-flex items-center justify-center gap-3 rounded-full border-2 border-ink bg-gold px-7 py-4 font-body text-sm font-extrabold uppercase tracking-[0.18em] text-ink transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Share2 className="h-4 w-4" />
        {isSharing ? "Sharing..." : "Share Your Shame"}
      </button>

      {statusMessage ? <p className="mt-4 font-body text-sm font-semibold text-ink/70">{statusMessage}</p> : null}
    </section>
  );
}
