"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  assignAccessScheduleSchema,
  unassignAccessScheduleSchema,
  getAccessSchedulePermissions,
  RoleEnum,
  AccessScheduleStatusEnum,
  type AccessScheduleDetailResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useFacilityStaffs } from "@/features/contract-management/hooks";
import {
  useAccessScheduleCaller,
  useAssignAccessSchedule,
  useClaimAccessSchedule,
  useUnassignAccessSchedule,
} from "../hooks";

export function AccessScheduleAssignmentActions({
  schedule,
  refreshing,
}: {
  schedule: AccessScheduleDetailResponse;
  refreshing: boolean;
}) {
  const t = useTranslations("accessScheduleDesk.assignment");
  const caller = useAccessScheduleCaller();
  const permissions = getAccessSchedulePermissions(schedule, caller);
  const errorMessage = useApiErrorMessage();
  const claim = useClaimAccessSchedule();
  const assign = useAssignAccessSchedule();
  const unassign = useUnassignAccessSchedule();
  const [mode, setMode] = useState<"assign" | "unassign" | null>(null);
  const [staffId, setStaffId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const staffQuery = useFacilityStaffs(undefined, mode === "assign");
  const busy = claim.isPending || assign.isPending || unassign.isPending;
  const allowed = mode === "assign" ? permissions.canAssign : permissions.canUnassign;

  if (schedule.status !== AccessScheduleStatusEnum.PENDING) return null;
  if (
    caller.facilityId !== schedule.facilityId ||
    ![RoleEnum.FACILITY_STAFF, RoleEnum.FACILITY_MANAGER].includes(caller.role as RoleEnum)
  )
    return null;

  const open = (next: "assign" | "unassign") => {
    setMode(next);
    setStaffId("");
    setReason("");
    setError(null);
  };
  const handleClaim = async () => {
    setError(null);
    try {
      await claim.mutateAsync(schedule.id);
      toast.success(t("claimed"));
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!allowed || busy || refreshing) return;
    setError(null);
    try {
      if (mode === "assign") {
        const parsed = assignAccessScheduleSchema.safeParse({
          staffId,
          assignmentVersion: schedule.assignmentVersion,
        });
        if (!parsed.success) {
          setError(t("staffRequired"));
          return;
        }
        await assign.mutateAsync({ id: schedule.id, payload: parsed.data });
        toast.success(t("assigned"));
      } else {
        const parsed = unassignAccessScheduleSchema.safeParse({
          reason,
          assignmentVersion: schedule.assignmentVersion,
        });
        if (!parsed.success) {
          setError(t("reasonRequired"));
          return;
        }
        await unassign.mutateAsync({ id: schedule.id, payload: parsed.data });
        toast.success(t("unassignedSuccess"));
      }
      setMode(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <UserRound className="size-4" />
        {t("title")}
      </h2>
      {permissions.canClaim ? (
        <Button disabled={busy || refreshing} onClick={() => void handleClaim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("claim")}
        </Button>
      ) : null}
      {permissions.canAssign ? (
        <Button disabled={busy || refreshing} onClick={() => open("assign")}>
          {t("assign")}
        </Button>
      ) : null}
      {permissions.canUnassign ? (
        <Button variant="outline" disabled={busy || refreshing} onClick={() => open("unassign")}>
          {t("unassign")}
        </Button>
      ) : null}
      {caller.role === RoleEnum.FACILITY_STAFF ? (
        <p className="text-xs text-slate-500">{t("contactManager")}</p>
      ) : null}
      {error && !mode ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Dialog
        open={mode !== null}
        onOpenChange={(value) => {
          if (!value && !busy) setMode(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(mode === "assign" ? "assign" : "unassign")}</DialogTitle>
            <DialogDescription>
              {t(mode === "assign" ? "assignHint" : "unassignHint")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            {mode === "assign" ? (
              <label className="block space-y-1 text-sm font-semibold">
                <span>{t("staff")}</span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                  disabled={busy || staffQuery.isFetching}
                  required
                >
                  <option value="">{t("chooseStaff")}</option>
                  {(staffQuery.data?.items ?? [])
                    .filter((staff) => staff.role === RoleEnum.FACILITY_STAFF)
                    .map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                </select>
                {staffQuery.isError ? (
                  <span role="alert" className="text-rose-700">
                    {errorMessage(staffQuery.error)}
                  </span>
                ) : null}
              </label>
            ) : (
              <label className="block space-y-1 text-sm font-semibold">
                <span>{t("reason")}</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={500}
                  required
                  disabled={busy}
                />
              </label>
            )}
            {!allowed ? (
              <p role="status" className="text-sm text-amber-700">
                {t("changed")}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setMode(null)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  busy ||
                  refreshing ||
                  !allowed ||
                  (mode === "assign" &&
                    (staffQuery.isFetching || staffQuery.isError || !staffId)) ||
                  (mode === "unassign" && !reason.trim())
                }
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {t("confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
