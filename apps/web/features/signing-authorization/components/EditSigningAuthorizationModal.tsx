"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSignature, Calendar, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import { useUpdateSigningAuthorization } from "../hooks";
import { formatToBackendDateTime, formatDateOnly } from "../utils";
import type { SigningAuthorizationResponse } from "../types";

interface EditSigningAuthorizationModalProps {
  authorization: SigningAuthorizationResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDateInput = (isoDate?: string | null) => {
  if (!isoDate) return "";
  try {
    const trimmed = isoDate.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

interface EditSigningAuthorizationContentProps {
  authorization: SigningAuthorizationResponse;
  onClose: () => void;
}

const EditSigningAuthorizationContent: React.FC<EditSigningAuthorizationContentProps> = ({
  authorization,
  onClose,
}) => {
  const t = useTranslations("signingAuthorizations");
  const updateMutation = useUpdateSigningAuthorization();

  const [validTo, setValidTo] = useState(() => formatDateInput(authorization.validTo));
  const [documentUrl, setDocumentUrl] = useState(() => authorization.documentUrl || "");
  const [notes, setNotes] = useState(() => authorization.notes || "");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const fromDate = new Date(authorization.validFrom);
    const toDate = validTo ? new Date(validTo) : new Date(authorization.validTo);

    if (toDate < fromDate) {
      setFormError(t("messages.dateValidation"));
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: authorization.id,
        payload: {
          validTo: validTo ? formatToBackendDateTime(validTo, true) : undefined,
          documentUrl: documentUrl || undefined,
          notes: notes.trim() || undefined,
        },
      });

      toast.success(t("messages.updateSuccess"));
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setFormError(apiErr.message || t("messages.error"));
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl md:max-w-3xl w-full rounded-3xl p-0 border border-slate-100 shadow-2xl bg-white overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                {t("modals.editTitle")}: {authorization.authorizationNumber}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("modals.editSubtitle")}</p>
            </div>
          </div>
        </DialogHeader>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Readonly Summary Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">{t("modals.issuedDate")}:</span>
            <span className="font-semibold text-slate-800">
              {formatDateOnly(authorization.issuedDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{t("modals.validFrom")}:</span>
            <span className="font-semibold text-emerald-700">
              {formatDateOnly(authorization.validFrom)}
            </span>
          </div>
        </div>

        {/* Valid To Date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            {t("modals.validTo")} (Gia hạn)
          </Label>
          <Input
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            className="h-11 text-xs rounded-xl border-slate-200"
          />
        </div>

        {/* Document Upload */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700">
              {t("modals.documentFile")}
            </Label>
            {authorization.documentUrl && (
              <button
                type="button"
                onClick={() => window.open(authorization.documentUrl, "_blank")}
                className="text-[11px] font-medium text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
              >
                <span>{t("modals.viewCurrentFile")}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
          <CloudinaryUploader
            folder={CloudinaryFolderEnum.CONTRACTS}
            multiple={false}
            accept="application/pdf,image/*"
            value={documentUrl ? [documentUrl] : []}
            onChange={(urls) => setDocumentUrl(urls[0] || "")}
            label={t("modals.uploadPrompt")}
            description={t("modals.uploadHint")}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">{t("modals.notes")}</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("modals.notesPlaceholder")}
            maxLength={500}
            rows={3}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </form>

      {/* Footer */}
      <div className="p-4 md:px-8 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl px-5 h-10 text-xs font-medium"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          {t("modals.cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl px-6 h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{t("modals.save")}</span>
        </Button>
      </div>
    </DialogContent>
  );
};

export const EditSigningAuthorizationModal: React.FC<EditSigningAuthorizationModalProps> = ({
  authorization,
  isOpen,
  onClose,
}) => {
  if (!authorization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isOpen && (
        <EditSigningAuthorizationContent
          key={authorization.id}
          authorization={authorization}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};
