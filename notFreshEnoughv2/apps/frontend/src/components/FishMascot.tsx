import { cn } from "../lib/utils/cn";

export function FishMascot({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 360 360"
      className={cn(compact ? "h-14 w-14" : "h-full w-full", className)}
      role="img"
      aria-label="NotFreshEnough fish mascot"
    >
      <defs>
        <linearGradient id="bodyGradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#b7d4da" />
          <stop offset="55%" stopColor="#7ea8b6" />
          <stop offset="100%" stopColor="#6f99ab" />
        </linearGradient>
        <linearGradient id="hatGradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#d8be82" />
          <stop offset="100%" stopColor="#aa7a37" />
        </linearGradient>
      </defs>

      <path d="M68 236c-28 18-45 15-52 9 11-3 23-14 31-26-18-1-28-13-31-21 17 5 34 3 51-10" fill="#0e1014" opacity="0.12" />
      <ellipse cx="196" cy="206" rx="112" ry="102" fill="url(#bodyGradient)" stroke="#101010" strokeWidth="10" />
      <path
        d="M111 178c-24 19-53 57-52 88 17-5 44-17 62-42"
        fill="#79a7b4"
        stroke="#101010"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path
        d="M177 88c27-23 92-28 141-7l-27 30c-51-17-91-15-118 2"
        fill="#c08e4f"
        stroke="#101010"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path
        d="M174 84 92 149c22 13 47 18 74 15 30-4 52-12 67-29l84-20c-9-42-80-56-143-31Z"
        fill="url(#hatGradient)"
        stroke="#101010"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path d="M161 100c24 13 47 31 68 55" stroke="#8d6229" strokeWidth="4" />
      <path d="M126 123c24 12 45 28 63 49" stroke="#8d6229" strokeWidth="4" />
      <path d="M203 93c29 13 54 33 74 59" stroke="#8d6229" strokeWidth="4" />
      <path d="M262 73 320 119" stroke="#c08e4f" strokeLinecap="round" strokeWidth="12" />
      <circle cx="228" cy="184" r="14" fill="#101010" />
      <circle cx="231" cy="179" r="5" fill="#fffdf3" />
      <circle cx="182" cy="170" r="14" fill="#101010" />
      <circle cx="185" cy="165" r="5" fill="#fffdf3" />
      <path d="M221 224c-15 18-46 18-62 2" fill="none" stroke="#101010" strokeLinecap="round" strokeWidth="8" />
      <path
        d="M229 214c17 0 28 4 35 12-6 14-18 21-35 22-12 0-23-6-27-18 6-10 15-16 27-16Z"
        fill="#f0bd52"
        stroke="#101010"
        strokeWidth="8"
      />
      <path d="M216 228h28" stroke="#101010" strokeLinecap="round" strokeWidth="6" />
      <path
        d="M77 134c-15 15-23 28-26 40 7 3 13 8 19 14-14 15-18 29-16 42 10-3 19-1 28 6-8 11-10 22-7 33 9-3 18-1 27 7"
        fill="none"
        stroke="#7b3d18"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path d="M89 128c-6 23 1 45 20 65" fill="none" stroke="#d78e60" strokeLinecap="round" strokeWidth="5" />
      <path d="M108 113c0 24 9 44 29 61" fill="none" stroke="#d78e60" strokeLinecap="round" strokeWidth="5" />
      <path d="M147 145c17-10 36-12 56-7" fill="none" opacity="0.45" stroke="#e6f0f2" strokeLinecap="round" strokeWidth="10" />
      <path d="M131 181c14-9 28-12 42-10" fill="none" opacity="0.35" stroke="#e6f0f2" strokeLinecap="round" strokeWidth="9" />
      <path d="M156 219c13-7 25-10 36-8" fill="none" opacity="0.28" stroke="#e6f0f2" strokeLinecap="round" strokeWidth="8" />
    </svg>
  );
}
