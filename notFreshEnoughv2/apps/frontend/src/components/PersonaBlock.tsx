import type { ReactNode } from "react";
import { cn } from "../lib/utils/cn";

export function PersonaBlock({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-paper", className)}>
      <div className="mb-4">
        <h3 className="font-display text-3xl text-ink">{title}</h3>
        {subtitle ? <p className="font-body text-sm uppercase tracking-[0.18em] text-ink/45">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
