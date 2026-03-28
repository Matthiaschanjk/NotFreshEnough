
import { cn } from "../lib/utils/cn";
import fishPng from "../assets/fish.png";

export function FishMascot({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <img
      src={fishPng}
      alt="NotFreshEnough fish mascot"
      className={cn(compact ? "h-14 w-14" : "h-full w-full", className)}
      draggable={false}
    />
  );
}
