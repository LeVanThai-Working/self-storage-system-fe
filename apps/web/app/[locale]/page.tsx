import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

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
      </div>
    </div>
  );
}
