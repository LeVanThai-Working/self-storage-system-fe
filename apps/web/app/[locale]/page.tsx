import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogIn, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-dark tracking-tight">
          Storage<span className="text-brand">Hub</span>
        </h1>
        <p className="text-lg text-neutral-muted">
          Safe Space, More Possibilities — Lưu trữ dễ dàng, Cuộc sống nhẹ nhàng hơn.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button variant="cta" size="lg">
            {tAuth("login")} (CTA Button)
          </Button>
          <Button variant="primary" size="lg">
            {tCommon("save")} (Primary Button)
          </Button>
          <Button variant="outline" size="lg">
            {tCommon("cancel")} (Outline Button)
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/${locale}/login`}
            className={cn(buttonVariants({ variant: "cta", size: "lg" }), "px-4")}
          >
            <LogIn />
            {tAuth("login")}
          </Link>
          <Link
            href={`/${locale}/register`}
            className={cn(buttonVariants({ variant: "primary", size: "lg" }), "px-4")}
          >
            <UserPlus />
            {tAuth("register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
