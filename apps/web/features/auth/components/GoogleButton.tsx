"use client";

import { useTranslations } from "next-intl";
import { authApi } from "@/features/auth/api";
import { cn } from "@/lib/utils";

export function GoogleButton({ className }: { className?: string }) {
  const t = useTranslations("auth");

  return (
    <a
      href={authApi.googleLoginUrl()}
      className={cn(
        "border-neutral-border text-neutral-main hover:bg-brand-bg flex h-12 w-full items-center justify-center gap-3 rounded-xl border bg-white text-sm font-semibold transition-colors",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.37-2.29v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
        />
      </svg>
      {t("continueWithGoogle")}
    </a>
  );
}

export function AuthDivider() {
  const t = useTranslations("auth");

  return (
    <div className="text-neutral-muted flex items-center gap-3 text-xs">
      <span className="bg-neutral-border h-px flex-1" />
      {t("or")}
      <span className="bg-neutral-border h-px flex-1" />
    </div>
  );
}
