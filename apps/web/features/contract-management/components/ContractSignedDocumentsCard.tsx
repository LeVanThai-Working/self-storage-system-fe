"use client";

import React, { useMemo } from "react";
import { ExternalLink, FileCheck, FileSignature, FileText } from "lucide-react";
import { InfoTooltip } from "@/components/ui/tooltip";
import {
  extractSignedAddendumFileUrls,
  ContractAddendumTypeEnum,
  type ContractResponse,
} from "@self-storage-system-fe/shared";

interface ContractSignedDocumentsCardProps {
  signedContractUrls: string[];
  contract?: ContractResponse | null;
  locale?: string;
  className?: string;
}

const getAddendumTypeLabel = (type: ContractAddendumTypeEnum, isEn: boolean) => {
  switch (type) {
    case ContractAddendumTypeEnum.RENEW:
      return isEn ? "Contract Extension" : "Gia hạn hợp đồng";
    case ContractAddendumTypeEnum.UNIT_CHANGE:
      return isEn ? "Storage Unit Transfer" : "Đổi phòng kho";
    case ContractAddendumTypeEnum.REMOVE:
      return isEn ? "Remove Amenities" : "Tháo dỡ tiện ích";
    case ContractAddendumTypeEnum.ADD:
    default:
      return isEn ? "Add Amenities" : "Thuê thêm tiện ích";
  }
};

interface SignedDocumentTileProps {
  url: string;
  alt: string;
  label: string;
  isEn: boolean;
}

const isPdfUrl = (url: string) => url.split("?")[0].toLowerCase().endsWith(".pdf");

/**
 * Shared tile used by both main contract scans and signed addendum scans
 * so document previews stay visually consistent across sections.
 */
const SignedDocumentTile: React.FC<SignedDocumentTileProps> = ({ url, alt, label, isEn }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="group relative rounded-md overflow-hidden border border-slate-200 aspect-[3/4] bg-slate-50 flex flex-col items-center justify-center p-2 text-center hover:border-emerald-500 hover:shadow-md transition-all block"
  >
    {isPdfUrl(url) ? (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="w-10 h-10 text-emerald-600 mb-2" />
        <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">
          {isEn ? "PDF file" : "Tệp PDF"}
        </span>
      </div>
    ) : (
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
      />
    )}
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
      <ExternalLink className="w-5 h-5 text-white" />
    </div>
    <span className="absolute bottom-2 inset-x-2 bg-black/70 text-[10px] font-bold text-white py-0.5 rounded-lg truncate px-1.5 text-center">
      {label}
    </span>
  </a>
);

export const ContractSignedDocumentsCard: React.FC<ContractSignedDocumentsCardProps> = ({
  signedContractUrls,
  contract,
  locale = "vi",
  className = "",
}) => {
  const isEn = locale === "en";

  const addendumDocuments = useMemo(() => {
    if (!contract?.addendums || contract.addendums.length === 0) return [];
    return contract.addendums
      .map((addendum) => {
        const files = extractSignedAddendumFileUrls(addendum, contract);
        return {
          addendum,
          files,
        };
      })
      .filter((item) => item.files.length > 0);
  }, [contract]);

  const totalAddendumFiles = addendumDocuments.reduce((sum, item) => sum + item.files.length, 0);
  const totalFiles = (signedContractUrls?.length || 0) + totalAddendumFiles;

  if (totalFiles === 0) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-xl border border-neutral-border p-6 shadow-sm space-y-5 ${className}`}
    >
      {/* Top Header: Total Documents */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-extrabold text-slate-900">
            {isEn ? "Signed documents" : "Hồ sơ đã ký"}
          </h3>
          <InfoTooltip
            content={
              isEn
                ? "Scanned paper contract & addendums signed by both parties."
                : "Bản scan hợp đồng và phụ lục có chữ ký tay của 2 bên."
            }
          />
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
          {totalFiles} {isEn ? "files" : "tài liệu"}
        </span>
      </div>

      {/* 1. Main Contract Signed Scans */}
      {signedContractUrls && signedContractUrls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              {isEn ? "Main contract (signed at check-in)" : "Hợp đồng chính"}
            </h4>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              {signedContractUrls.length} {isEn ? "pages" : "trang"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {signedContractUrls.map((url, idx) => (
              <SignedDocumentTile
                key={`contract-${url}-${idx}`}
                url={url}
                alt={`Signed contract scan page ${idx + 1}`}
                label={isEn ? `Page ${idx + 1}` : `Trang ${idx + 1}`}
                isEn={isEn}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Signed Addendum Scans (Separated from Addendum Requests) */}
      {addendumDocuments.length > 0 && (
        <div
          className={`space-y-3 ${
            signedContractUrls && signedContractUrls.length > 0
              ? "pt-4 border-t border-slate-100"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-teal-600" />
              {isEn ? "Signed addendums" : "Phụ lục đã ký"}
            </h4>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
              {totalAddendumFiles} {isEn ? "files" : "bản scan"}
            </span>
          </div>

          <div className="space-y-4">
            {addendumDocuments.map(({ addendum, files }, addendumIdx) => (
              <div
                key={addendum.id}
                className={`space-y-3 ${addendumIdx > 0 ? "pt-4 border-t border-slate-100" : ""}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      #{addendum.addendumCode}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                      {getAddendumTypeLabel(addendum.type, isEn)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {files.length} {isEn ? "scans" : "tài liệu"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {files.map((url, fIdx) => (
                    <SignedDocumentTile
                      key={`addendum-${addendum.id}-${url}-${fIdx}`}
                      url={url}
                      alt={`Addendum scan page ${fIdx + 1}`}
                      label={isEn ? `Scan ${fIdx + 1}` : `Bản scan ${fIdx + 1}`}
                      isEn={isEn}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
