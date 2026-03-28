import { FishMascot } from "./FishMascot";

export function Header() {
  return (
    <header className="px-4 pt-6 md:px-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 md:block">
          <FishMascot compact />
        </div>
        <div className="text-center">
          <p className="font-body text-xs uppercase tracking-[0.38em] text-ink/50">An AI Family Panel Powered by TinyFish</p>
          <h1 className="font-display text-5xl leading-none text-ink md:text-7xl">NotFreshEnough</h1>
        </div>
      </div>
      <div className="ink-divider mt-5" />
    </header>
  );
}
