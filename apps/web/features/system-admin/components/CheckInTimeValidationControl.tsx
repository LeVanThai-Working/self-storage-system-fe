"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Clock, Loader2 } from "lucide-react";
import api from "@/lib/api/axios";
import { Button } from "@/components/ui/button";
import { useApiErrorMessage } from "@/features/auth/error-message";

const key = ["system-settings", "check-in-time-validation"] as const;
const endpoint = "/system-settings/check-in-time-validation";

export function CheckInTimeValidationControl() {
  const t = useTranslations("systemAdmin.checkInTimeValidation");
  const errorMessage = useApiErrorMessage();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get<{ data: { enabled: boolean } }>(endpoint);
      return data.data;
    },
  });
  const update = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await api.patch<{ data: { enabled: boolean } }>(endpoint, { enabled });
      return data.data;
    },
    onSuccess: (data) => client.setQueryData(key, data),
  });
  const error = update.error ?? query.error;

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Clock className="size-5 shrink-0 text-teal-700" />
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
        </div>
        <Button
          type="button"
          role="switch"
          aria-label={t("title")}
          aria-checked={query.data?.enabled ?? true}
          disabled={!query.data || query.isFetching || update.isPending}
          variant={query.data?.enabled === false ? "outline" : "default"}
          onClick={() => update.mutate(!query.data!.enabled)}
        >
          {query.isLoading || update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {query.isLoading
            ? t("loading")
            : query.data?.enabled === false
              ? t("disabled")
              : t("enabled")}
        </Button>
      </div>
      {query.data?.enabled === false ? (
        <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          {t("demoNotice")}
        </p>
      ) : null}
      {error ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-rose-700">
          <span>{errorMessage(error)}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
