import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth.layout");
  const locale = useLocale();
  const homeHref = `/${locale}`;

  const highlights = [
    { icon: ShieldCheck, title: t("security"), description: t("securityDesc") },
    { icon: KeyRound, title: t("access"), description: t("accessDesc") },
    { icon: Wallet, title: t("payment"), description: t("paymentDesc") },
  ];

  return (
    <div className="bg-brand-pageBg grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className="from-brand-dark to-brand relative hidden overflow-hidden bg-linear-to-br p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-white/5" />
        <div className="bg-cta/20 pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full blur-3xl" />

        <Logo href={homeHref} inverted size="lg" className="relative" />

        <div className="relative my-auto max-w-md space-y-8 py-12">
          <div className="space-y-4">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight xl:text-4xl">
              {t("headline")}
            </h2>
            <p className="text-base leading-relaxed text-white/75">{t("subheadline")}</p>
          </div>

          <ul className="space-y-5">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} StorageHub. {t("rights")}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Logo href={homeHref} size="sm" showTagline={false} className="lg:invisible" />
          <Link
            href={homeHref}
            className="text-neutral-muted hover:text-brand inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t("backHome")}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
