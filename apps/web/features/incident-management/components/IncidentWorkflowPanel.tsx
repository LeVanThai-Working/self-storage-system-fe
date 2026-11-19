"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CloudinaryFolderEnum,
  RoleEnum,
  evacuateIncidentRackSchema,
  getIncidentActions,
  uploadRestorationManifestSchema,
  type IncidentResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { useAuthStore } from "@/features/auth/store";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useUnitInventoryTree, useUnitRacks } from "@/features/inventory-operations/hooks";
import type { IncidentPortal } from "../types";
import { useEvacuateIncidentRack, useUploadRestorationManifest } from "../hooks";

const INPUT = "w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900";

/** Incident-only operations; normal inventory transfers remain in the inventory module. */
export function IncidentWorkflowPanel({
  incident,
  portalBase,
}: {
  incident: IncidentResponse;
  portalBase: IncidentPortal;
}) {
  const t = useTranslations("incidentWorkflow");
  const locale = useLocale();
  const getError = useApiErrorMessage();
  const role = useAuthStore((s) => s.currentUser?.role);
  const manager =
    (portalBase === "facility-manager" && role === RoleEnum.FACILITY_MANAGER) ||
    (portalBase === "business-ops" && role === RoleEnum.BUSINESS_OPS_MANAGER);
  const worker = manager || (portalBase === "facility-staff" && role === RoleEnum.FACILITY_STAFF);
  const actions = getIncidentActions(incident);
  const racksQuery = useUnitRacks(
    actions.canEvacuate && worker ? incident.storageUnit?.id : undefined
  );
  const treeQuery = useUnitInventoryTree(
    actions.canEvacuate && worker ? incident.storageUnit?.id : undefined
  );
  const evacuate = useEvacuateIncidentRack(incident.id);
  const upload = useUploadRestorationManifest(incident.id);
  const [selectedRack, setSelectedRack] = useState(incident.storageRack?.id ?? "");
  const rackId = incident.storageRack?.id ?? selectedRack;
  const [counts, setCounts] = useState<
    Record<string, { actual: string; condition: string; notes: string }>
  >({});
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [relocationChoice, setRelocation] = useState<boolean | null>(null);
  const relocation = relocationChoice ?? incident.requiresRelocation;
  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const items =
    treeQuery.data?.racks
      .find((r) => r.id === rackId)
      ?.tiers.flatMap((tier) =>
        tier.items
          .filter((item) => item.quantity > 0)
          .map((item) => ({ ...item, tier: tier.tierNumber }))
      ) ?? [];
  const duplicateSku = new Set(items.map((item) => item.sku.id)).size !== items.length;
  const manifest = incident.preEvacuationManifest;
  const updateCount = (id: string, field: "actual" | "condition" | "notes", value: string) =>
    setCounts((previous) => ({
      ...previous,
      [id]: { ...(previous[id] ?? { actual: "", condition: "", notes: "" }), [field]: value },
    }));

  const submitEvacuation = async () => {
    setError(null);
    if (!actions.canEvacuate || imagesUploading || evacuate.isPending) return;
    if (duplicateSku || !items.length || treeQuery.isError || treeQuery.isFetching)
      return setError(t("inventoryUnavailable"));
    if (items.some((item) => !counts[item.inventoryId]?.actual.trim()))
      return setError(t("countRequired"));
    const parsed = evacuateIncidentRackSchema.safeParse({
      fromRackId: rackId,
      evidenceImages: images,
      emergencyReason: reason,
      requiresRelocation: relocation,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        skuId: item.sku.id,
        actualQuantity: Number(counts[item.inventoryId].actual),
        condition: counts[item.inventoryId].condition || undefined,
        notes: counts[item.inventoryId].notes || undefined,
      })),
    });
    if (!parsed.success) return setError(t("invalidEvacuation"));
    if (!window.confirm(t("evacuationConfirm"))) return;
    try {
      await evacuate.mutateAsync(parsed.data);
      setOpened(false);
      toast.success(t("evacuated"));
    } catch (err) {
      setError(getError(err));
    }
  };
  const submitManifest = async () => {
    setError(null);
    if (!actions.canUploadManifest || documentUploading || upload.isPending) return;
    const parsed = uploadRestorationManifestSchema.safeParse({
      restorationManifestDocUrl: documents[0],
    });
    if (!parsed.success) return setError(t("documentRequired"));
    try {
      await upload.mutateAsync(parsed.data);
      setDocuments([]);
      toast.success(t("uploaded"));
    } catch (err) {
      setError(getError(err));
    }
  };

  if (
    !incident.preEvacuationManifest &&
    (incident.locationType === "common_area" || !incident.storageUnit?.id)
  ) {
    return (
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold">{t("locationScopeTitle")}</h2>
        <p className="text-sm text-slate-600">
          {t(incident.locationType === "common_area" ? "commonAreaFlow" : "locationMissing")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-900">{t("title")}</h2>
      <p className="text-sm text-slate-600">
        {incident.requiresRelocation ? t("relocation") : t("repairInPlace")}
      </p>
      {!incident.storageRack?.id && !incident.preEvacuationManifest ? (
        <p className="text-sm text-slate-600">{t("rackRequired")}</p>
      ) : null}
      {incident.requiresRelocation && incident.contract?.id && (
        <Link
          className="block text-sm font-semibold text-teal-700 underline"
          href={`/${locale}/${portalBase}/contracts/${incident.contract.id}`}
        >
          {t("openContract")}
        </Link>
      )}
      {manifest && (
        <div className="space-y-3">
          <h3 className="font-semibold">{t("evacuationManifest")}</h3>
          <p className="text-xs text-slate-600">
            {new Date(manifest.evacuatedAt).toLocaleString(locale)}
          </p>
          <p className="text-sm text-slate-600">
            {t("evacuatedBy", {
              name:
                typeof manifest.evacuatedBy === "string"
                  ? manifest.evacuatedBy
                  : (manifest.evacuatedBy.name ?? manifest.evacuatedBy.id),
            })}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">{t("sku")}</th>
                  <th>{t("systemQuantity")}</th>
                  <th>{t("actualQuantity")}</th>
                  <th>{t("discrepancy")}</th>
                </tr>
              </thead>
              <tbody>
                {manifest.items.map((item, index) => (
                  <tr key={`${item.skuId}-${index}`}>
                    <td className="py-2">
                      {item.skuName ?? item.skuCode ?? item.skuId}
                      <p className="text-xs text-slate-500">
                        {[item.condition, item.notes].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="text-center">{item.systemQuantity}</td>
                    <td className="text-center">{item.actualQuantity}</td>
                    <td className="text-center">{item.discrepancy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            {t("totals")}: {manifest.totalSystemQuantity} / {manifest.totalActualQuantity} /{" "}
            {manifest.totalDiscrepancy}
          </p>
          {manifest.notes && <p className="text-sm">{manifest.notes}</p>}
          <div className="flex flex-wrap gap-3">
            {manifest.evidenceImages.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-700 underline"
              >
                {t("photo")} {i + 1}
              </a>
            ))}
          </div>
          <p className="rounded-lg bg-teal-50 p-3 text-sm font-semibold">
            {actions.terminal
              ? t("completed")
              : !actions.closureStatus
                ? t("waitingRepair")
                : !incident.restorationManifestDocUrl
                  ? t("missingDocument")
                  : !incident.customerAcknowledgedAt
                    ? t("waitingCustomer")
                    : t("readyToClose")}
          </p>
        </div>
      )}
      {incident.restorationManifestDocUrl && (
        <div className="space-y-1 text-sm">
          <a
            href={incident.restorationManifestDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 underline"
          >
            {t("viewDocument")}
          </a>
          {incident.restorationUploadedAt && (
            <p>
              {t("uploadedAt")}: {new Date(incident.restorationUploadedAt).toLocaleString(locale)}
            </p>
          )}
          <p>
            {typeof incident.restorationUploadedBy === "object"
              ? incident.restorationUploadedBy?.name
              : incident.restorationUploadedBy}
          </p>
        </div>
      )}
      {incident.customerAcknowledgedAt && (
        <div className="text-sm">
          <p>
            {t("acknowledgedAt")}:{" "}
            {new Date(incident.customerAcknowledgedAt).toLocaleString(locale)}
          </p>
          <p>
            {typeof incident.customerAcknowledgedBy === "object"
              ? incident.customerAcknowledgedBy?.name
              : incident.customerAcknowledgedBy}
          </p>
          <p>{incident.customerAcknowledgeNotes}</p>
        </div>
      )}
      {worker && actions.canEvacuate && (
        <>
          <Button variant="outline" onClick={() => setOpened(!opened)}>
            {t("evacuate")}
          </Button>
          {opened && (
            <fieldset disabled={evacuate.isPending} className="space-y-3 border-t pt-3">
              <p className="text-sm text-amber-800">{t("evacuationHint")}</p>
              {!incident.storageUnit?.id && <p role="alert">{t("unitRequired")}</p>}
              {incident.storageUnit?.id && (
                <>
                  <label className="block text-sm">
                    {t("rack")}
                    <select
                      className={INPUT}
                      value={rackId}
                      disabled={Boolean(incident.storageRack)}
                      onChange={(e) => {
                        setSelectedRack(e.target.value);
                        setCounts({});
                      }}
                    >
                      <option value="">{t("selectRack")}</option>
                      {(racksQuery.data ?? []).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.rackCode}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(treeQuery.isError || racksQuery.isError) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void treeQuery.refetch();
                        void racksQuery.refetch();
                      }}
                    >
                      {t("retry")}
                    </Button>
                  )}
                  {duplicateSku && (
                    <p role="alert" className="text-red-700">
                      {t("duplicateSku")}
                    </p>
                  )}
                  {!items.length && <p>{t("inventoryUnavailable")}</p>}
                  {items.map((item) => (
                    <div key={item.inventoryId} className="space-y-2 rounded-lg border p-3 text-sm">
                      <p className="font-semibold">
                        {item.sku.name} · T{item.tier} · {t("systemQuantity")}: {item.quantity}
                      </p>
                      <label className="block">
                        {t("actualQuantity")} *
                        <input
                          className={INPUT}
                          type="number"
                          min={0}
                          step={1}
                          value={counts[item.inventoryId]?.actual ?? ""}
                          onChange={(e) => updateCount(item.inventoryId, "actual", e.target.value)}
                        />
                      </label>
                      <p>
                        {t("discrepancy")}:{" "}
                        {counts[item.inventoryId]?.actual
                          ? Number(counts[item.inventoryId].actual) - item.quantity
                          : "—"}
                      </p>
                      <label className="block">
                        {t("condition")}
                        <input
                          className={INPUT}
                          maxLength={200}
                          value={counts[item.inventoryId]?.condition ?? ""}
                          onChange={(e) =>
                            updateCount(item.inventoryId, "condition", e.target.value)
                          }
                        />
                      </label>
                      <label className="block">
                        {t("notes")}
                        <input
                          className={INPUT}
                          maxLength={500}
                          value={counts[item.inventoryId]?.notes ?? ""}
                          onChange={(e) => updateCount(item.inventoryId, "notes", e.target.value)}
                        />
                      </label>
                    </div>
                  ))}
                  <label className="block text-sm">
                    {t("reason")} *
                    <textarea
                      className={INPUT}
                      maxLength={2000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    {t("method")}
                    <select
                      className={INPUT}
                      value={String(relocation)}
                      onChange={(e) => setRelocation(e.target.value === "true")}
                    >
                      <option value="false">{t("repairRack")}</option>
                      <option value="true">{t("relocation")}</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    {t("notes")}
                    <textarea
                      className={INPUT}
                      maxLength={1000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                  <CloudinaryUploader
                    value={images}
                    onChange={setImages}
                    folder={CloudinaryFolderEnum.INCIDENTS}
                    accept="image/*"
                    label={t("evidence")}
                    onUploadingChange={setImagesUploading}
                    maxFiles={6}
                    disabled={evacuate.isPending}
                  />
                  <Button
                    onClick={() => void submitEvacuation()}
                    disabled={
                      evacuate.isPending ||
                      imagesUploading ||
                      duplicateSku ||
                      !items.length ||
                      treeQuery.isFetching ||
                      treeQuery.isError
                    }
                  >
                    {t("evacuate")}
                  </Button>
                </>
              )}
            </fieldset>
          )}
        </>
      )}
      {manager && actions.canUploadManifest && (
        <fieldset disabled={upload.isPending} className="space-y-3 border-t pt-3">
          <CloudinaryUploader
            value={documents}
            onUploadingChange={setDocumentUploading}
            onChange={setDocuments}
            folder={CloudinaryFolderEnum.INCIDENTS}
            multiple={false}
            maxFiles={1}
            maxSizeMB={10}
            accept="image/*,application/pdf"
            label={t("uploadDocument")}
            description={t("documentHint")}
            disabled={upload.isPending}
          />
          <Button
            onClick={() => void submitManifest()}
            disabled={upload.isPending || documentUploading || !documents.length}
          >
            {t("saveDocument")}
          </Button>
        </fieldset>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
