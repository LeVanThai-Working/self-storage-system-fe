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
import { useUnitRacks } from "@/features/inventory-operations/hooks";
import { CATEGORY_ICON } from "./IncidentBadges";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";

/** Select a room with optional rack/tier detail, or a described common area. */
export function ReportIncidentDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("incidentDesk");
  const getErrorMessage = useApiErrorMessage();
  const { data: facility } = useMyFacility();
  const unitsQuery = useFacilityMapLayout(facility?.id);
  const reportMutation = useReportIncident();
  const [locationType, setLocationType] = useState<"storage_unit" | "common_area" | "">("");
  const [commonAreaLocation, setCommonAreaLocation] = useState("");

  const [unitId, setUnitId] = useState("");
  const [rackId, setRackId] = useState("");
  const [tierId, setTierId] = useState("");
  const racksQuery = useUnitRacks(unitId || undefined);
  const rack = racksQuery.data?.find((item) => item.id === rackId);
  const [category, setCategory] = useState<IncidentCategoryEnum>(IncidentCategoryEnum.STRUCTURAL);
  const [severity, setSeverity] = useState<IncidentSeverityEnum>(IncidentSeverityEnum.MEDIUM);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!facility?.id) return;
    if (!locationType) return setError(t("form.locationRequired"));
    if (locationType !== "common_area" && !unitsQuery.data?.some((unit) => unit.id === unitId))
      return setError(t("form.unitRequired"));
    if (rackId && !rack) return setError(t("form.rackRequired"));
    if (tierId && !rack?.tiers?.some((tier) => tier.id === tierId))
      return setError(t("form.locationInvalid"));
    const payload = {
      facilityId: facility.id,
      locationType:
        locationType === "common_area" ? "common_area" : rackId ? "storage_rack" : "storage_unit",
      commonAreaLocation: locationType === "common_area" ? commonAreaLocation : undefined,
      storageUnitId: unitId || undefined,
      storageRackId: rackId || undefined,
      rackTierId: tierId || undefined,
      contractId: rack?.currentContractId || undefined,
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
          : [
                "storageUnitId",
                "storageRackId",
                "rackTierId",
                "commonAreaLocation",
                "locationType",
              ].includes(String(field))
            ? t("form.locationInvalid")
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
            <label className={LABEL}>{t("form.locationType")} *</label>
            <select
              value={locationType}
              onChange={(event) => {
                setLocationType(event.target.value as typeof locationType);
                setUnitId("");
                setRackId("");
                setTierId("");
                setCommonAreaLocation("");
              }}
              className={INPUT}
            >
              <option value="">{t("form.selectLocationType")}</option>
              <option value="storage_unit">{t("form.roomLocation")}</option>
              <option value="common_area">{t("form.commonArea")}</option>
            </select>
          </div>
          {locationType === "common_area" ? (
            <div>
              <label className={LABEL}>{t("form.commonAreaLocation")} *</label>
              <input
                value={commonAreaLocation}
                onChange={(event) => setCommonAreaLocation(event.target.value)}
                maxLength={300}
                placeholder={t("form.commonAreaPlaceholder")}
                className={INPUT}
              />
              <p className="mt-1 text-xs text-slate-500">{t("form.commonAreaHint")}</p>
            </div>
          ) : null}
          {locationType === "storage_unit" && (
            <div>
              <label className={LABEL}>{t("form.unit")} *</label>
              <select
                value={unitId}
                onChange={(event) => {
                  setUnitId(event.target.value);
                  setRackId("");
                  setTierId("");
                }}
                className={INPUT}
              >
                <option value="">{t("form.selectUnit")}</option>
                {(unitsQuery.data ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unitNumber} · {t("form.floor", { floor: unit.floor })}
                  </option>
                ))}
              </select>
              {unitsQuery.isError ? (
                <button
                  type="button"
                  onClick={() => void unitsQuery.refetch()}
                  className="mt-2 text-sm text-red-600"
                >
                  {t("form.retryUnits")}
                </button>
              ) : null}
            </div>
          )}
          {locationType === "storage_unit" &&
            unitId &&
            (racksQuery.isLoading || racksQuery.isError || Boolean(racksQuery.data?.length)) && (
              <div>
                <label className={LABEL}>{t("form.rackOptional")}</label>
                <select
                  className={INPUT}
                  value={rackId}
                  onChange={(e) => {
                    setRackId(e.target.value);
                    setTierId("");
                  }}
                >
                  <option value="">{t("form.wholeUnit")}</option>
                  {(racksQuery.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.rackCode}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{t("form.rackHint")}</p>
                {racksQuery.isError && (
                  <button type="button" onClick={() => void racksQuery.refetch()}>
                    {t("form.retryRacks")}
                  </button>
                )}
              </div>
            )}
          {rack && (
            <div>
              <label className={LABEL}>{t("form.tier")}</label>
              <select className={INPUT} value={tierId} onChange={(e) => setTierId(e.target.value)}>
                <option value="">{t("form.wholeRack")}</option>
                {(rack.tiers ?? []).map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    T{tier.tierNumber}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                {t(rack.currentContractId ? "form.linkedContract" : "form.noLinkedContract")}
              </p>
            </div>
          )}
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
                    className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-xs font-semibold ${
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
                  className={`flex-1 rounded-md border px-2 py-2 text-xs font-semibold ${
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
            disabled={
              reportMutation.isPending ||
              !facility?.id ||
              !locationType ||
              (locationType !== "common_area" && (unitsQuery.isLoading || unitsQuery.isError)) ||
              (Boolean(rackId) && (racksQuery.isLoading || racksQuery.isError))
            }
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
