"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  FileSignature,
  Building,
  User,
  Building2,
  Calendar,
  FileText,
  ExternalLink,
  Info,
  Clock,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SigningAuthorizationStatusBadge } from "./SigningAuthorizationStatusBadge";
import { formatDateOnly } from "../utils";
import type { SigningAuthorizationResponse } from "../types";

interface SigningAuthorizationDetailModalProps {
  authorization: SigningAuthorizationResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (isoString?: string | null) => formatDateOnly(isoString);

export const SigningAuthorizationDetailModal: React.FC<SigningAuthorizationDetailModalProps> = ({
  authorization,
  isOpen,
  onClose,
}) => {
  const t = useTranslations("signingAuthorizations");

  if (!authorization) return null;

  const legalEntity =
    typeof authorization.legalEntityId === "object" && authorization.legalEntityId !== null
      ? authorization.legalEntityId
      : null;

  const authorizedUser =
    typeof authorization.authorizedUserId === "object" && authorization.authorizedUserId !== null
      ? authorization.authorizedUserId
      : null;

  const facilities = (authorization.facilityIds || []).map((f) =>
    typeof f === "object" && f !== null
      ? f
      : { _id: String(f), name: String(f), code: "", address: "" }
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full rounded-3xl p-0 border border-slate-100 shadow-2xl bg-white overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-50">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                    {authorization.authorizationNumber}
                  </DialogTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{t("modals.detailSubtitle")}</p>
                </div>
              </div>
              <SigningAuthorizationStatusBadge status={authorization.status} />
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 text-sm text-slate-700">
          {/* Legal Entity & Authorized User Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Legal Entity */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
                <Building className="w-4 h-4" />
                <span>{t("columns.legalEntity")}</span>
              </div>
              {legalEntity ? (
                <div>
                  <p className="font-semibold text-slate-900">{legalEntity.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("modals.taxCode")}:{" "}
                    <span className="font-mono text-slate-700">{legalEntity.taxCode}</span>
                  </p>
                  {legalEntity.address && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{legalEntity.address}</p>
                  )}
                  {legalEntity.representativeName && (
                    <p className="text-xs text-slate-600 mt-1">
                      {t("modals.representative")}: {legalEntity.representativeName}
                      {legalEntity.representativePosition
                        ? ` (${legalEntity.representativePosition})`
                        : ""}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-600">
                  {String(authorization.legalEntityId)}
                </p>
              )}
            </div>

            {/* Authorized User */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>{t("columns.authorizedUser")}</span>
              </div>
              {authorizedUser ? (
                <div>
                  <p className="font-semibold text-slate-900">{authorizedUser.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{authorizedUser.email}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">
                    {t("modals.role")}: {authorizedUser.role}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-600">
                  {String(authorization.authorizedUserId)}
                </p>
              )}
            </div>
          </div>

          {/* Authorized Facilities */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>
                {t("columns.facilities")} ({facilities.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {facilities.map((fac, idx) => (
                <div
                  key={fac._id || idx}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-medium text-slate-800 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{fac.name}</span>
                  {fac.code && (
                    <span className="text-[11px] font-mono text-slate-400">({fac.code})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t("modals.issuedDate")}</span>
              </div>
              <p className="font-semibold text-slate-900">{formatDate(authorization.issuedDate)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t("modals.validFrom")}</span>
              </div>
              <p className="font-semibold text-slate-900">{formatDate(authorization.validFrom)}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-orange-600 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t("modals.validTo")}</span>
              </div>
              <p className="font-semibold text-slate-900">{formatDate(authorization.validTo)}</p>
            </div>
          </div>

          {/* Document Section */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">{t("columns.document")}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-md font-mono mt-0.5">
                  {authorization.documentUrl}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-teal-200 text-teal-700 hover:bg-teal-100/50 shrink-0 gap-1.5 text-xs"
              onClick={() =>
                window.open(authorization.documentUrl, "_blank", "noopener,noreferrer")
              }
            >
              <span>{t("modals.viewDocument")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Notes */}
          {authorization.notes && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Info className="w-3.5 h-3.5" />
                <span>{t("modals.notes")}</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{authorization.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {t("modals.createdAt")}: {formatDate(authorization.createdAt)}
            </span>
            <span>
              {t("modals.updatedAt")}: {formatDate(authorization.updatedAt)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:px-8 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button
            variant="outline"
            className="rounded-xl px-5 h-10 text-xs font-medium"
            onClick={onClose}
          >
            {t("modals.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
