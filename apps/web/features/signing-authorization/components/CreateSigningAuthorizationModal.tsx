"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileSignature,
  Building,
  User,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { CloudinaryFolderEnum } from "@self-storage-system-fe/shared";
import {
  useCreateSigningAuthorization,
  useLegalEntities,
  useFacilityManagers,
  useFacilitiesList,
} from "../hooks";
import { formatToBackendDateTime } from "../utils";

interface CreateSigningAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSigningAuthorizationModal: React.FC<CreateSigningAuthorizationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useTranslations("signingAuthorizations");
  const createMutation = useCreateSigningAuthorization();

  const { data: legalEntities = [], isLoading: isLoadingEntities } = useLegalEntities();
  const { data: managers = [], isLoading: isLoadingManagers } = useFacilityManagers();
  const { data: facilities = [], isLoading: isLoadingFacilities } = useFacilitiesList();

  const [legalEntityId, setLegalEntityId] = useState("");
  const [authorizedUserId, setAuthorizedUserId] = useState("");
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [authorizationNumber, setAuthorizationNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setLegalEntityId("");
    setAuthorizedUserId("");
    setSelectedFacilityIds([]);
    setAuthorizationNumber("");
    setIssuedDate("");
    setValidFrom("");
    setValidTo("");
    setDocumentUrl("");
    setNotes("");
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleFacility = (facilityId: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId) ? prev.filter((id) => id !== facilityId) : [...prev, facilityId]
    );
  };

  const selectAllFacilities = () => {
    if (selectedFacilityIds.length === facilities.length) {
      setSelectedFacilityIds([]);
    } else {
      setSelectedFacilityIds(facilities.map((f) => f.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!legalEntityId) {
      setFormError(t("messages.legalEntityRequired"));
      return;
    }
    if (!authorizedUserId) {
      setFormError(t("messages.authorizedUserRequired"));
      return;
    }
    if (selectedFacilityIds.length === 0) {
      setFormError(t("messages.atLeastOneFacility"));
      return;
    }
    if (!authorizationNumber.trim()) {
      setFormError(t("messages.authNumberRequired"));
      return;
    }
    if (!issuedDate) {
      setFormError(t("messages.issuedDateRequired"));
      return;
    }
    if (!validFrom || !validTo) {
      setFormError(t("messages.validityRequired"));
      return;
    }

    const fromDate = new Date(validFrom);
    const toDate = new Date(validTo);
    if (toDate < fromDate) {
      setFormError(t("messages.dateValidation"));
      return;
    }

    if (!documentUrl) {
      setFormError(t("messages.documentRequired"));
      return;
    }

    try {
      await createMutation.mutateAsync({
        legalEntityId,
        authorizedUserId,
        facilityIds: selectedFacilityIds,
        authorizationNumber: authorizationNumber.trim(),
        issuedDate: formatToBackendDateTime(issuedDate, false),
        validFrom: formatToBackendDateTime(validFrom, false),
        validTo: formatToBackendDateTime(validTo, true),
        documentUrl,
        notes: notes.trim() || undefined,
      });

      toast.success(t("messages.createSuccess"));
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setFormError(apiErr.message || t("messages.error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 rounded-3xl border border-slate-100 shadow-2xl bg-white overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                  {t("modals.createTitle")}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">{t("modals.createSubtitle")}</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Legal Entity & Manager selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Legal Entity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{t("modals.legalEntitySelect")}</span>
                <span className="text-rose-500">*</span>
              </Label>
              <select
                value={legalEntityId}
                onChange={(e) => setLegalEntityId(e.target.value)}
                disabled={isLoadingEntities}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">-- {t("modals.chooseLegalEntity")} --</option>
                {legalEntities.map((entity) => (
                  <option key={entity._id} value={entity._id}>
                    {entity.name} ({entity.taxCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Authorized User (Facility Manager) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t("modals.managerSelect")}</span>
                <span className="text-rose-500">*</span>
              </Label>
              <select
                value={authorizedUserId}
                onChange={(e) => setAuthorizedUserId(e.target.value)}
                disabled={isLoadingManagers}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">-- {t("modals.chooseManager")} --</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.name} ({mgr.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Authorized Facilities (Multi-select) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t("modals.facilitiesSelect")}</span>
                <span className="text-rose-500">*</span>
                <span className="text-[11px] font-normal text-slate-400 ml-1">
                  ({selectedFacilityIds.length}/{facilities.length})
                </span>
              </Label>
              <button
                type="button"
                onClick={selectAllFacilities}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
              >
                {selectedFacilityIds.length === facilities.length
                  ? t("modals.deselectAll")
                  : t("modals.selectAll")}
              </button>
            </div>

            {isLoadingFacilities ? (
              <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>Loading facilities...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                {facilities.map((facility) => {
                  const isChecked = selectedFacilityIds.includes(facility.id);
                  return (
                    <button
                      type="button"
                      key={facility.id}
                      onClick={() => toggleFacility(facility.id)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-medium flex items-start gap-3 transition-all ${
                        isChecked
                          ? "bg-teal-50/90 border-teal-500 text-teal-950 ring-1 ring-teal-500/20 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 leading-snug break-words">
                          {facility.name}
                        </p>
                        {(facility.code || facility.address || facility.city) && (
                          <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {facility.code && (
                              <span className="inline-block font-mono text-teal-700 font-semibold mr-1.5 px-1 py-0.2 bg-teal-50 rounded">
                                [{facility.code}]
                              </span>
                            )}
                            <span className="break-words">{facility.address || facility.city}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Decision Number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span>{t("columns.authorizationNumber")}</span>
              <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="text"
              value={authorizationNumber}
              onChange={(e) => setAuthorizationNumber(e.target.value)}
              placeholder="Ví dụ: 01/2026/UQ-STORAGEHUB"
              maxLength={100}
              className="h-11 text-xs rounded-xl border-slate-200"
              required
            />
          </div>

          {/* 4. Dates: IssuedDate, ValidFrom, ValidTo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{t("modals.issuedDate")}</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="h-11 text-xs rounded-xl border-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t("modals.validFrom")}</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="h-11 text-xs rounded-xl border-slate-200"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>{t("modals.validTo")}</span>
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="h-11 text-xs rounded-xl border-slate-200"
                required
              />
            </div>
          </div>

          {/* 5. Cloudinary Document Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span>{t("modals.documentFile")} (PDF / Image)</span>
              <span className="text-rose-500">*</span>
            </Label>
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

          {/* 6. Notes */}
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
            onClick={handleClose}
            disabled={createMutation.isPending}
          >
            {t("modals.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl px-6 h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{t("modals.create")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
