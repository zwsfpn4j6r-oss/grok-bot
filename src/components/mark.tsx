import { cn } from "@/lib/cn";

export function Mark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 120" className={cn("shrink-0", className)} aria-hidden>
      <circle cx="60" cy="60" r="60" className={inverted ? "fill-bg" : "fill-ink"} />
      <g className={inverted ? "fill-ink" : "fill-bg"} transform="rotate(18 60 60)">
        <rect x="36" y="34" width="18" height="52" rx="9" />
        <rect x="66" y="34" width="18" height="52" rx="9" />
      </g>
    </svg>
  );
}
