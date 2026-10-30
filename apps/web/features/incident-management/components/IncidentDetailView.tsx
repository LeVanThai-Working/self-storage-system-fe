"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Check, Loader2, Siren, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  CloudinaryFolderEnum,
  IncidentLiablePartyEnum,
  IncidentSeverityEnum,
  IncidentStatusEnum,
  RoleEnum,
  investigateIncidentSchema,
  resolveIncidentSchema,
  type IncidentResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useAuthStore } from "@/features/auth/store";
import { useFacilityStaffs } from "@/features/contract-management/hooks";
import { getCurrentUserId } from "@/features/contract-management/utils";
import { useUnitRacks } from "@/features/inventory-operations/hooks";
import { RackIncidentDialog } from "@/features/inventory-operations/components/RackIncidentDialog";
import type { FacilityPortal } from "@/features/inventory-operations/components/RequestQueueView";
import { formatDateTime, refName } from "@/features/support-desk/utils";
import {
  useAssignIncident,
  useCancelIncident,
  useCloseIncident,
  useIncident,
  useInvestigateIncident,
  useResolveIncident,
} from "../hooks";
import {
  IncidentCategoryLabel,
  IncidentSeverityBadge,
  IncidentStatusBadge,
} from "./IncidentBadges";

const CARD = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";
const MIN_TEXT = 5;

const OPEN_STATUSES = new Set([
  IncidentStatusEnum.REPORTED,
  IncidentStatusEnum.ASSIGNED,
  IncidentStatusEnum.INVESTIGATING,
  IncidentStatusEnum.IN_PROGRESS,
]);

const formatVnd = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

/** W2 — incident detail with the action panel for the current step (assign → investigate → resolve → close). */
export function IncidentDetailView({ id, portalBase }: { id: string; portalBase: FacilityPortal }) {
  const t = useTranslations("incidentDesk");
  const locale = useLocale();
  const incidentQuery = useIncident(id);
  const incident = incidentQuery.data;

  if (incidentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!incident) return <p className="text-sm text-slate-500">{t("detail.notFound")}</p>;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/${locale}/${portalBase}/incidents`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("title")} / {incident.incidentCode}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {incident.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <IncidentSeverityBadge severity={incident.severity} />
          <IncidentStatusBadge status={incident.status} />
          <IncidentCategoryLabel category={incident.category} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <ReportCard incident={incident} />
          <TimelineCard incident={incident} />
          <WarehouseCard incident={incident} />
        </div>
        <ActionPanel incident={incident} portalBase={portalBase} />
      </div>
    </div>
  );
}

function ReportCard({ incident }: { incident: IncidentResponse }) {
  const t = useTranslations("incidentDesk.detail");
  const reporter = typeof incident.reporter === "object" ? incident.reporter : null;
  const location = [
    incident.storageUnit?.unitNumber && t("unit", { unit: incident.storageUnit.unitNumber }),
    incident.storageRack?.rackCode && t("rack", { rack: incident.storageRack.rackCode }),
    incident.rackTier?.tierNumber && t("tier", { tier: incident.rackTier.tierNumber }),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section className={CARD}>
      <p className="mb-3 text-sm font-bold text-slate-800">{t("reportTitle")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">{t("reporter")}</p>
          <p className="font-semibold">
            {reporter?.name ?? "—"} · {t(`role.${incident.reporterRole}`)}
          </p>
          {reporter?.phoneNumber ? <p className="text-slate-500">{reporter.phoneNumber}</p> : null}
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-xs text-slate-500">{t("contract")}</p>
          <p className="font-mono font-semibold text-teal-700">
            {incident.contract?.contractCode ?? "—"}
          </p>
          <p className="text-slate-500">{location || t("commonArea")}</p>
        </div>
      </div>
      <p className="my-3 whitespace-pre-line text-sm text-slate-600">{incident.description}</p>
      <div className="flex flex-wrap gap-2">
        {incident.images.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" className="h-24 w-36 rounded-lg object-cover" />
        ))}
      </div>
    </section>
  );
}

function TimelineCard({ incident }: { incident: IncidentResponse }) {
  const t = useTranslations("incidentDesk.timeline");
  const reporterName = refName(incident.reporter) ?? "—";
  const events = [
    {
      done: true,
      title: t("reported", { name: reporterName }),
      meta: formatDateTime(incident.createdAt),
    },
    incident.assignedStaff
      ? { done: true, title: t("assigned", { name: incident.assignedStaff.name ?? "—" }), meta: "" }
      : null,
    incident.investigationNotes
      ? {
          done: true,
          title: t("investigated"),
          meta: incident.investigationNotes,
          relocation: incident.requiresRelocation,
        }
      : null,
    incident.resolution
      ? { done: true, title: t("resolved"), meta: formatDateTime(incident.resolution.resolvedAt) }
      : null,
    incident.closedAt
      ? { done: true, title: t("closed"), meta: formatDateTime(incident.closedAt) }
      : null,
    incident.cancelledAt
      ? { done: true, title: t("cancelled"), meta: incident.cancellationReason ?? "" }
      : null,
  ].filter((event): event is NonNullable<typeof event> => Boolean(event));

  return (
    <section className={CARD}>
      <p className="mb-3 text-sm font-bold text-slate-800">{t("title")}</p>
      <ol className="space-y-3 border-l border-dashed border-teal-200 pl-5">
        {events.map((event, index) => (
          <li key={index} className="relative text-sm">
            <span className="absolute -left-[29px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
              <Check className="h-3 w-3" />
            </span>
            <p className="font-semibold text-slate-800">{event.title}</p>
            {event.meta ? <p className="text-slate-500">{event.meta}</p> : null}
            {"relocation" in event && event.relocation ? (
              <span className="mt-1 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                {t("needsRelocation")}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Lets staff move goods off a damaged rack (S5) straight from the incident. */
function WarehouseCard({ incident }: { incident: IncidentResponse }) {
  const t = useTranslations("incidentDesk.warehouse");
  const [open, setOpen] = useState(false);
  const urgent =
    incident.requiresRelocation ||
    incident.severity === IncidentSeverityEnum.HIGH ||
    incident.severity === IncidentSeverityEnum.CRITICAL;
  const racksQuery = useUnitRacks(incident.storageRack ? incident.storageUnit?.id : undefined);
  const rack = racksQuery.data?.find((item) => item.id === incident.storageRack?.id);

  if (!incident.storageRack || !urgent || !OPEN_STATUSES.has(incident.status)) return null;

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50/50 p-5">
      <div className="flex items-start gap-3">
        <TriangleAlert className="h-5 w-5 text-orange-600" />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{t("title")}</p>
          <p className="text-sm text-slate-600">{t("subtitle")}</p>
        </div>
      </div>
      <Button
        onClick={() => setOpen(true)}
        disabled={!rack}
        className="mt-3 bg-orange-500 text-white hover:bg-orange-600"
      >
        <Siren className="h-4 w-4" />
        {t("open", { rack: incident.storageRack.rackCode ?? "" })}
      </Button>
      {open && rack ? (
        <RackIncidentDialog
          open
          onClose={() => setOpen(false)}
          fromRack={rack}
          racks={racksQuery.data ?? []}
          incidentId={incident.id}
        />
      ) : null}
    </section>
  );
}

function ActionPanel({
  incident,
  portalBase,
}: {
  incident: IncidentResponse;
  portalBase: FacilityPortal;
}) {
  const t = useTranslations("incidentDesk.action");
  const getErrorMessage = useApiErrorMessage();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isManager =
    portalBase === "facility-manager" &&
    String(currentUser?.role ?? "").toLowerCase() === RoleEnum.FACILITY_MANAGER;
  const isAssignee = incident.assignedStaff?.id === getCurrentUserId(currentUser);
  const canWork = isManager || isAssignee;

  const staffQuery = useFacilityStaffs(undefined, isManager);
  const assignMutation = useAssignIncident(incident.id);
  const investigateMutation = useInvestigateIncident(incident.id);
  const resolveMutation = useResolveIncident(incident.id);
  const closeMutation = useCloseIncident(incident.id);
  const cancelMutation = useCancelIncident(incident.id);

  const [staffId, setStaffId] = useState(incident.assignedStaff?.id ?? "");
  const [notes, setNotes] = useState(incident.investigationNotes ?? "");
  const [maintenance, setMaintenance] = useState(incident.putUnitUnderMaintenance);
  const [relocation, setRelocation] = useState(incident.requiresRelocation);
  const [solution, setSolution] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [liable, setLiable] = useState<IncidentLiablePartyEnum>(IncidentLiablePartyEnum.FACILITY);
  const [repairCost, setRepairCost] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
  const [closeNotes, setCloseNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setError(null);
    try {
      await fn();
      toast.success(message);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const status = incident.status;
  const canAssign =
    isManager && (status === IncidentStatusEnum.REPORTED || status === IncidentStatusEnum.ASSIGNED);
  const canInvestigate =
    canWork &&
    (status === IncidentStatusEnum.ASSIGNED || status === IncidentStatusEnum.INVESTIGATING);
  const canResolve =
    canWork &&
    (status === IncidentStatusEnum.INVESTIGATING || status === IncidentStatusEnum.IN_PROGRESS);
  const canClose = isManager && status === IncidentStatusEnum.RESOLVED;
  const canCancel =
    isManager && (status === IncidentStatusEnum.REPORTED || status === IncidentStatusEnum.ASSIGNED);

  const submitInvestigate = () => {
    const payload = {
      investigationNotes: notes.trim(),
      putUnitUnderMaintenance: maintenance,
      requiresRelocation: relocation,
    };
    if (!investigateIncidentSchema.safeParse(payload).success)
      return setError(t("textMin", { min: MIN_TEXT }));
    void run(() => investigateMutation.mutateAsync(payload), t("investigated"));
  };

  const submitResolve = () => {
    const payload = {
      resolutionNotes: solution.trim(),
      staffEvidenceImages: evidence,
      repairCost,
      liableParty: liable,
      damageFee: liable === IncidentLiablePartyEnum.CUSTOMER ? damageFee : 0,
    };
    const parsed = resolveIncidentSchema.safeParse(payload);
    if (!parsed.success) {
      return setError(
        parsed.error.issues[0]?.path[0] === "staffEvidenceImages"
          ? t("evidenceRequired")
          : t("textMin", { min: MIN_TEXT })
      );
    }
    void run(() => resolveMutation.mutateAsync(parsed.data), t("resolved"));
  };

  return (
    <aside className={`${CARD} h-fit space-y-4`}>
      <p className="text-base font-extrabold text-slate-900">{t("title")}</p>

      {canAssign ? (
        <div className="space-y-2">
          <label className={LABEL}>{t("assignLabel")}</label>
          <select
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            className={INPUT}
          >
            <option value="">{t("assignPlaceholder")}</option>
            {(staffQuery.data?.items ?? []).map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() =>
              void run(
                () => assignMutation.mutateAsync({ assignedStaffId: staffId }),
                t("assigned")
              )
            }
            disabled={!staffId || assignMutation.isPending}
            className="w-full bg-teal-600 text-white hover:bg-teal-700"
          >
            {t("assign")}
          </Button>
        </div>
      ) : incident.assignedStaff ? (
        <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-teal-700">
          <Check className="mr-1 inline h-4 w-4" />
          {t("assignedTo", { name: incident.assignedStaff.name ?? "—" })}
        </p>
      ) : null}

      {canInvestigate ? (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className={LABEL}>{t("investigateLabel")} *</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={2000}
            className={INPUT}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(event) => setMaintenance(event.target.checked)}
              className="accent-teal-600"
            />
            {t("putUnitUnderMaintenance")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={relocation}
              onChange={(event) => setRelocation(event.target.checked)}
              className="accent-teal-600"
            />
            {t("requiresRelocation")}
          </label>
          <Button
            onClick={submitInvestigate}
            disabled={investigateMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {t("saveInvestigation")}
          </Button>
        </div>
      ) : null}

      {canResolve ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-slate-800">{t("resolveTitle")}</p>
          <div>
            <label className={LABEL}>{t("solution")} *</label>
            <textarea
              value={solution}
              onChange={(event) => setSolution(event.target.value)}
              rows={3}
              maxLength={2000}
              className={INPUT}
            />
          </div>
          <CloudinaryUploader
            value={evidence}
            onChange={setEvidence}
            folder={CloudinaryFolderEnum.INCIDENTS}
            multiple
            maxFiles={6}
            accept="image/*"
            label={`${t("evidence")} *`}
          />
          <div>
            <label className={LABEL}>{t("liableParty")}</label>
            <select
              value={liable}
              onChange={(event) => setLiable(event.target.value as IncidentLiablePartyEnum)}
              className={INPUT}
            >
              {Object.values(IncidentLiablePartyEnum).map((value) => (
                <option key={value} value={value}>
                  {t(`liable.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL}>{t("repairCost")}</label>
              <input
                type="number"
                min={0}
                value={repairCost}
                onChange={(event) =>
                  setRepairCost(Math.max(0, Math.floor(Number(event.target.value) || 0)))
                }
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>{t("damageFee")}</label>
              <input
                type="number"
                min={0}
                disabled={liable !== IncidentLiablePartyEnum.CUSTOMER}
                value={liable === IncidentLiablePartyEnum.CUSTOMER ? damageFee : 0}
                onChange={(event) =>
                  setDamageFee(Math.max(0, Math.floor(Number(event.target.value) || 0)))
                }
                className={`${INPUT} disabled:bg-slate-100`}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">{t("damageFeeHint")}</p>
          <Button
            onClick={submitResolve}
            disabled={resolveMutation.isPending}
            className="w-full bg-teal-600 text-white hover:bg-teal-700"
          >
            {resolveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {t("resolve")}
          </Button>
        </div>
      ) : null}

      {incident.resolution ? (
        <div className="space-y-1 rounded-lg bg-teal-50/60 p-3 text-sm">
          <p className="font-bold text-slate-800">{t("resolutionTitle")}</p>
          <p>{incident.resolution.resolutionNotes}</p>
          <p className="text-slate-600">
            {t(`liable.${incident.resolution.liableParty}`)} ·{" "}
            {formatVnd(incident.resolution.repairCost)} ·{" "}
            {t("feeShort", { fee: formatVnd(incident.resolution.damageFee) })}
          </p>
        </div>
      ) : null}

      {canClose ? (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <input
            value={closeNotes}
            onChange={(event) => setCloseNotes(event.target.value)}
            maxLength={1000}
            placeholder={t("closeNotes")}
            className={INPUT}
          />
          <Button
            onClick={() =>
              void run(
                () => closeMutation.mutateAsync({ notes: closeNotes.trim() || undefined }),
                t("closed")
              )
            }
            disabled={closeMutation.isPending}
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
          >
            {t("close")}
          </Button>
        </div>
      ) : null}

      {canCancel ? (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <input
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            maxLength={500}
            placeholder={t("cancelReason")}
            className={INPUT}
          />
          <button
            type="button"
            onClick={() =>
              cancelReason.trim().length < MIN_TEXT
                ? setError(t("textMin", { min: MIN_TEXT }))
                : void run(
                    () => cancelMutation.mutateAsync({ cancellationReason: cancelReason.trim() }),
                    t("cancelled")
                  )
            }
            className="w-full text-center text-sm font-semibold text-rose-600 hover:underline"
          >
            {t("cancel")}
          </button>
        </div>
      ) : null}

      {!canAssign &&
      !canInvestigate &&
      !canResolve &&
      !canClose &&
      !canCancel &&
      !incident.resolution ? (
        <p className="text-sm text-slate-500">{t("nothingToDo")}</p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
