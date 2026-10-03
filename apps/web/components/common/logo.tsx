import Link from "next/link";
import { cn } from "@/lib/utils";

const iconSizes = {
  sm: "size-7",
  md: "size-9",
  lg: "size-11",
};

const titleSizes = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

interface LogoProps {
  className?: string;
  href?: string;
  showTagline?: boolean;
  size?: keyof typeof iconSizes;
  /** Use light text for dark backgrounds */
  inverted?: boolean;
}

export function Logo({ className, href, showTagline = true, size = "md", inverted }: LogoProps) {
  const content = (
    <div className={cn("group inline-flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "relative shrink-0 transition-transform duration-300 group-hover:scale-105",
          iconSizes[size]
        )}
      >
        <svg viewBox="0 0 48 48" fill="none" className="size-full drop-shadow-sm" aria-hidden>
          <path d="M24 4L42 14.5L24 25L6 14.5L24 4Z" fill="#0B927E" />
          <path d="M6 14.5L24 25V44L6 33.5V14.5Z" fill="#FF702E" />
          <path d="M24 25L42 14.5V33.5L24 44V25Z" fill="#064E4B" />
          <path d="M24 6L39 14.5L24 23L9 14.5L24 6Z" fill="#34D399" fillOpacity="0.4" />
        </svg>
      </div>
      <div className="flex flex-col text-left">
        <span
          className={cn(
            "leading-tight font-extrabold tracking-tight",
            inverted ? "text-white" : "text-neutral-main",
            titleSizes[size]
          )}
        >
          Storage<span className={inverted ? "text-brand-light" : "text-brand"}>Hub</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-0.5 text-[10px] leading-none font-medium tracking-wide sm:text-[11px]",
              inverted ? "text-white/70" : "text-neutral-muted"
            )}
          >
            Safe Space, More Possibilities
          </span>
        )}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-block focus:outline-none">
      {content}
    </Link>
  );
}
