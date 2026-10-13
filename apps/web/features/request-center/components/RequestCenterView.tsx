"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FilePlus2, FileText, ListChecks } from "lucide-react";
import { useMyFacility } from "@/features/storage-unit-management/hooks";
import { CatalogView } from "./CatalogView";
import { RequestsTable } from "./RequestsTable";
import { CreateRequestModal } from "./CreateRequestModal";

export const RequestCenterView = () => {
  const t = useTranslations("facilityManager.requests");
  const { data: facility } = useMyFacility();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          disabled={!facility?.id}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <FilePlus2 className="w-4 h-4" />
          {t("createRequest")}
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          {t("catalogSectionTitle")}
        </h2>
        <CatalogView facilityId={facility?.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-emerald-600" />
          {t("requestsSectionTitle")}
        </h2>
        <RequestsTable />
      </section>

      {facility?.id && (
        <CreateRequestModal
          facilityId={facility.id}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  );
};
