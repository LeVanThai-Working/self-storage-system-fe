"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRevokeSigningAuthorization } from "../hooks";
import type { SigningAuthorizationResponse } from "../types";

interface RevokeSigningAuthorizationModalProps {
  authorization: SigningAuthorizationResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RevokeSigningAuthorizationModal: React.FC<RevokeSigningAuthorizationModalProps> = ({
  authorization,
  isOpen,
  onClose,
}) => {
  const t = useTranslations("signingAuthorizations");
  const revokeMutation = useRevokeSigningAuthorization();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const handleRevoke = async () => {
    if (!authorization) return;
    setErrorMessage(null);

    try {
      await revokeMutation.mutateAsync(authorization.id);
      toast.success(t("messages.revokeSuccess"));
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr.message || t("messages.error"));
    }
  };

  if (!authorization) return null;

  const managerName =
    typeof authorization.authorizedUserId === "object" && authorization.authorizedUserId !== null
      ? authorization.authorizedUserId.name
      : String(authorization.authorizedUserId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md rounded-3xl p-0 border border-slate-100 shadow-2xl bg-white overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-rose-100 bg-rose-50/50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-md shadow-rose-500/10 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  {t("modals.revokeTitle")}
                </DialogTitle>
                <p className="text-xs text-rose-600 font-medium mt-0.5">
                  {authorization.authorizationNumber}
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              {errorMessage}
            </div>
          )}

          <p className="leading-relaxed">{t("modals.revokeConfirm", { manager: managerName })}</p>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">{t("columns.authorizationNumber")}:</span>
              <span className="font-semibold text-slate-800">
                {authorization.authorizationNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t("columns.authorizedUser")}:</span>
              <span className="font-semibold text-slate-800">{managerName}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl px-5 text-xs font-medium"
            onClick={handleClose}
            disabled={revokeMutation.isPending}
          >
            {t("modals.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleRevoke}
            className="rounded-xl px-5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm"
            disabled={revokeMutation.isPending}
          >
            {revokeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t("modals.revoke")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
