import { Share2 } from "lucide-react";
import facebookIcon from "../assets/facebook.png";
import instagramIcon from "../assets/Instagram.jpg";
import tiktokIcon from "../assets/tiktok-logo.png";

interface ShareSectionProps {
  onShare: () => void;
  statusMessage?: string | null;
  isSharing: boolean;
}

export function ShareSection({ onShare, statusMessage, isSharing }: ShareSectionProps) {
  return (
    <section className="w-full rounded-[2rem] border border-ink/12 bg-white/78 px-6 py-7 text-center shadow-paper">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="font-display text-3xl text-ink">Share your shame</p>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="rounded-full bg-white/80 p-1 shadow-md transition hover:scale-110 hover:bg-blue-100"
              title="Share on Facebook"
            >
              <img src={facebookIcon} alt="Facebook logo" className="h-7 w-7 object-contain" />
            </a>
            <a
              href="#"
              className="rounded-full bg-white/80 p-1 shadow-md transition hover:scale-110 hover:bg-pink-100"
              title="Share on Instagram"
            >
              <img src={instagramIcon} alt="Instagram logo" className="h-7 w-7 object-contain" />
            </a>
            <a
              href="#"
              className="rounded-full bg-white/80 p-1 shadow-md transition hover:scale-110 hover:bg-black/10"
              title="Share on TikTok"
            >
              <img src={tiktokIcon} alt="TikTok logo" className="h-7 w-7 object-contain" />
            </a>
          </div>
        </div>
      </div>

      <p className="mt-2 font-body text-sm text-ink/62">
        This one not scam, can forward to your group chat.
      </p>

      <button
        type="button"
        onClick={onShare}
        disabled={isSharing}
        className="mt-6 inline-flex items-center justify-center gap-3 rounded-full border-2 border-ink bg-gold px-7 py-4 font-body text-sm font-extrabold uppercase tracking-[0.18em] text-ink transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Share2 className="h-4 w-4" />
        {isSharing ? "Sharing..." : "Share your shame"}
      </button>

      {statusMessage ? <p className="mt-4 font-body text-sm font-semibold text-ink/70">{statusMessage}</p> : null}
    </section>
  );
}
