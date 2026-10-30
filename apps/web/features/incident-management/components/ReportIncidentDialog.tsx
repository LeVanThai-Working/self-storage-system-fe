"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  CloudinaryFolderEnum,
  IncidentCategoryEnum,
  IncidentSeverityEnum,
  reportIncidentSchema,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useFacilityMapLayout, useMyFacility } from "@/features/storage-unit-management/hooks";
import { useReportIncident } from "../hooks";
import { CATEGORY_ICON } from "./IncidentBadges";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";

/** Staff / FM report an incident inside their own facility (unit optional, ≥1 photo). */
export function ReportIncidentDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("incidentDesk");
  const getErrorMessage = useApiErrorMessage();
  const { data: facility } = useMyFacility();
  const unitsQuery = useFacilityMapLayout(facility?.id);
  const reportMutation = useReportIncident();

  const [unitId, setUnitId] = useState("");
  const [category, setCategory] = useState<IncidentCategoryEnum>(IncidentCategoryEnum.STRUCTURAL);
  const [severity, setSeverity] = useState<IncidentSeverityEnum>(IncidentSeverityEnum.MEDIUM);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!facility?.id) return;
    const payload = {
      facilityId: facility.id,
      storageUnitId: unitId || undefined,
      category,
      severity,
      title: title.trim(),
      description: description.trim(),
      images,
      putUnitUnderMaintenance: false,
      requiresRelocation: false,
    };
    const parsed = reportIncidentSchema.safeParse(payload);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === "images"
          ? t("form.imagesRequired")
          : field === "title"
            ? t("form.titleInvalid")
            : t("form.descriptionInvalid")
      );
      return;
    }
    try {
      const incident = await reportMutation.mutateAsync(parsed.data);
      toast.success(t("form.created", { code: incident.incidentCode }));
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !reportMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("form.title")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className={LABEL}>{t("form.unit")}</label>
            <select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              className={INPUT}
            >
              <option value="">{t("form.commonArea")}</option>
              {(unitsQuery.data ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unitNumber} · {t("form.floor", { floor: unit.floor })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>{t("form.category")} *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(IncidentCategoryEnum).map((value) => {
                const Icon = CATEGORY_ICON[value];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold ${
                      category === value
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`category.${value}`)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={LABEL}>{t("form.severity")}</label>
            <div className="flex gap-2">
              {Object.values(IncidentSeverityEnum).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeverity(value)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                    severity === value
                      ? value === IncidentSeverityEnum.CRITICAL
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {t(`severity.${value}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>{t("form.titleLabel")} *</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>{t("form.description")} *</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={2000}
              className={INPUT}
            />
          </div>
          <CloudinaryUploader
            value={images}
            onChange={setImages}
            folder={CloudinaryFolderEnum.INCIDENTS}
            multiple
            maxFiles={5}
            accept="image/*"
            label={`${t("form.images")} *`}
          />
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={reportMutation.isPending}>
            {t("form.cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={reportMutation.isPending}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {reportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
