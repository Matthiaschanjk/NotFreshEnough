import fishPng from "../assets/fish.png";
import { cn } from "../lib/utils/cn";

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
      alt="TinyFish logo"
      className={cn(compact ? "h-16 w-16 max-w-full object-contain" : "h-auto w-full max-w-full object-contain", className)}
      draggable={false}
    />
  );
}
