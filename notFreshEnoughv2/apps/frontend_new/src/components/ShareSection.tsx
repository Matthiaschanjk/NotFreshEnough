import { Share2 } from "lucide-react";
import facebookIcon from "../assets/facebook.png";
import instagramIcon from "../assets/instagram.jpg";
import tiktokIcon from "../assets/tiktok-logo.png";

interface ShareSectionProps {
  onShare: () => void;
  statusMessage?: string | null;
  isSharing: boolean;
}

export function ShareSection({ onShare, statusMessage, isSharing }: ShareSectionProps) {
  return (
    <section className="rounded-[2rem] border border-ink/12 bg-white/78 px-6 py-7 text-center shadow-paper">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-4">
          <p className="font-display text-3xl text-ink mb-0">Share your Shame</p>
          <div className="flex items-center gap-2 ml-2">
            <a href="#" className="rounded-full bg-white/80 shadow-md p-1 transition hover:bg-blue-100 hover:scale-110" title="Share on Facebook">
              <img src={facebookIcon} alt="Facebook" className="w-7 h-7 object-contain" />
            </a>
            <a href="#" className="rounded-full bg-white/80 shadow-md p-1 transition hover:bg-pink-100 hover:scale-110" title="Share on Instagram">
              <img src={instagramIcon} alt="Instagram" className="w-7 h-7 object-contain" />
            </a>
            <a href="#" className="rounded-full bg-white/80 shadow-md p-1 transition hover:bg-black/10 hover:scale-110" title="Share on TikTok">
              <img src={tiktokIcon} alt="TikTok" className="w-7 h-7 object-contain" />
            </a>
          </div>
        </div>
      </div>
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
