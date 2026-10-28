"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRestore, useTrash } from "../hooks";
import { TRASH_TABS, type TrashTabId } from "../trash";

function TrashTab({ tabId }: { tabId: TrashTabId }) {
  const t = useTranslations("trash");
  const locale = useLocale();
  const { entries, isLoading, isError, refetch } = useTrash(tabId);
  const restore = useRestore(tabId);

  const onRestore = (id: string) =>
    restore.mutate(id, {
      onSuccess: () => toast.success(t("restored")),
      onError: (error) => toast.error(error.message || t("restoreFailed")),
    });

  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;

  if (isError) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
        <p className="text-slate-500">{t("loadFailed")}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">{t("columns.name")}</th>
            <th className="px-5 py-3">{t("columns.deletedAt")}</th>
            <th className="px-5 py-3">{t("columns.deletedBy")}</th>
            <th className="px-5 py-3 text-right">{t("columns.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((e) => (
            <tr key={e.resourceId}>
              <td className="px-5 py-3">
                <div className="font-medium text-slate-800">{e.label}</div>
                <div className="font-mono text-xs text-slate-400">{e.resourceId}</div>
              </td>
              <td className="px-5 py-3 text-slate-600">
                {new Date(e.deletedAt).toLocaleString(locale === "en" ? "en-US" : "vi-VN")}
              </td>
              <td className="px-5 py-3 text-slate-600">{e.deletedBy ?? "—"}</td>
              <td className="px-5 py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restore.isPending}
                  onClick={() => onRestore(e.resourceId)}
                >
                  <RotateCcw /> {t("restore")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TrashCenter() {
  const t = useTranslations("trash");
  const [tab, setTab] = useState<TrashTabId>(TRASH_TABS[0].id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TRASH_TABS.map(({ id }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-emerald-50 text-emerald-700"
                : "bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      <TrashTab key={tab} tabId={tab} />
    </div>
  );
}
