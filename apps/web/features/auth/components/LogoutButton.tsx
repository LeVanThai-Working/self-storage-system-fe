"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useLogout } from "@/features/auth/hooks";

/** Signs the user out and returns to the login page; shared by all portal layouts. */
export function LogoutButton() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () =>
    logout.mutate(undefined, {
      onSettled: () => {
        router.replace(`/${locale}/login`);
        router.refresh();
      },
    });

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={logout.isPending}
      aria-label={t("logout")}
      title={t("logout")}
      className="p-2.5 text-slate-500 hover:text-red-600 transition-colors rounded-full hover:bg-slate-50 disabled:opacity-50"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
