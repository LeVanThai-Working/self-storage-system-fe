import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: `${t("login")} | StorageHub` };
}

export default function LoginPage() {
  return (
    // useSearchParams() in LoginForm requires a Suspense boundary
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
