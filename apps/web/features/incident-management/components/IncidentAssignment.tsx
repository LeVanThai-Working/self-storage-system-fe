"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getIncidentActions,
  RoleEnum,
  type IncidentResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useFacilityStaffs } from "@/features/contract-management/hooks";
import { fetchIncidentStaffs } from "../api";
import { useAssignIncident } from "../hooks";
import type { IncidentPortal } from "../types";

/** The same assignment form is available from the list and incident detail. */
export function IncidentAssignment({
  incident,
  portalBase,
  onAssigned,
}: {
  incident: IncidentResponse;
  portalBase: IncidentPortal;
  onAssigned?: () => void;
}) {
  const t = useTranslations("incidentDesk.action");
  const getError = useApiErrorMessage();
  const selectId = useId();
  const role = useAuthStore((state) => state.currentUser?.role);
  const manager = portalBase === "facility-manager" && role === RoleEnum.FACILITY_MANAGER;
  const ops = portalBase === "business-ops" && role === RoleEnum.BUSINESS_OPS_MANAGER;
  const canAssign = (manager || ops) && getIncidentActions(incident).canAssign;
  const facilityId =
    typeof incident.facility === "string" ? incident.facility : incident.facility.id;
  const facilityStaff = useFacilityStaffs(undefined, manager && canAssign);
  const opsStaff = useQuery({
    queryKey: ["incident-staffs", facilityId],
    queryFn: () => fetchIncidentStaffs(facilityId),
    enabled: ops && canAssign && Boolean(facilityId),
  });
  const query = ops ? opsStaff : facilityStaff;
  const staff = ops ? (opsStaff.data ?? []) : (facilityStaff.data?.items ?? []);
  const mutation = useAssignIncident(incident.id);
  const [staffId, setStaffId] = useState(incident.assignedStaff?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const valid = staff.some((person) => person.id === staffId);

  const submit = async () => {
    if (!canAssign || !valid || mutation.isPending) return;
    setError(null);
    try {
      await mutation.mutateAsync({ assignedStaffId: staffId });
      toast.success(t("assigned"));
      onAssigned?.();
    } catch (err) {
      setError(getError(err));
    }
  };

  if (!canAssign) return null;
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        {t("assignedTo", {
          name: incident.assignedStaff?.name ?? incident.assignedStaff?.id ?? t("unassigned"),
        })}
      </p>
      <label htmlFor={selectId} className="block text-sm font-semibold">
        {t("assignLabel")}
      </label>
      <select
        id={selectId}
        value={staffId}
        onChange={(event) => setStaffId(event.target.value)}
        disabled={query.isLoading || mutation.isPending}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">{t("assignPlaceholder")}</option>
        {staff.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">{t("assignmentHint")}</p>
      {query.isLoading ? <p className="text-sm text-slate-500">{t("loadingStaff")}</p> : null}
      {query.error ? (
        <div role="alert" className="space-y-2 text-sm text-red-600">
          <p>{getError(query.error)}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            {t("retryStaff")}
          </Button>
        </div>
      ) : null}
      {!query.isLoading && !query.error && !staff.length ? (
        <p className="text-sm text-slate-500">{t("noStaff")}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Button
        onClick={() => void submit()}
        disabled={!valid || query.isLoading || Boolean(query.error) || mutation.isPending}
        className="w-full bg-teal-600 text-white hover:bg-teal-700"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {incident.assignedStaff ? t("reassign") : t("assign")}
      </Button>
    </div>
  );
}
