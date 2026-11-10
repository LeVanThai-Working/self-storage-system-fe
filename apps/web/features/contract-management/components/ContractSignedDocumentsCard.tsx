"use client";

import React, { useMemo } from "react";
import { ExternalLink, FileCheck, FileSignature, FileText } from "lucide-react";
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
      className={`bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5 ${className}`}
    >
      {/* Top Header: Total Documents */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              {isEn ? "Signed Legal Documents" : "Hồ sơ & Tài liệu Ký sống"}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isEn
                ? "Scanned paper contract & addendums with live signatures, verified and stored for compliance."
                : "Bản scan tài liệu hợp đồng và phụ lục có chữ ký sống của 2 bên đã được số hóa lưu vết toàn vẹn."}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          {totalFiles} {isEn ? "files in total" : "tổng tài liệu"}
        </span>
      </div>

      {/* 1. Main Contract Signed Scans */}
      {signedContractUrls && signedContractUrls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              {isEn
                ? "1. Original Contract Scans (Check-in)"
                : "1. Tài liệu Hợp đồng chính (Lúc nhận kho)"}
            </h4>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {signedContractUrls.length} {isEn ? "pages" : "trang scan"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {signedContractUrls.map((url, idx) => (
              <a
                key={`contract-${url}-${idx}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group relative rounded-2xl overflow-hidden border border-slate-200 aspect-[3/4] bg-slate-50 flex flex-col items-center justify-center p-2 text-center hover:border-emerald-500 hover:shadow-md transition-all block"
              >
                {url.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="w-10 h-10 text-emerald-600 mb-2" />
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">
                      PDF Document
                    </span>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Signed contract scan page ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-2 inset-x-2 bg-black/70 text-[10px] font-bold text-white py-0.5 rounded-lg truncate px-1.5 text-center">
                  {isEn ? `Page ${idx + 1}` : `Trang ${idx + 1}`}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 2. Signed Addendum Scans (Separated from Addendum Requests) */}
      {addendumDocuments.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-teal-600" />
              {isEn ? "2. Signed Addendum Scans" : "2. Tài liệu Phụ lục đã ký"}
            </h4>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              {totalAddendumFiles} {isEn ? "files" : "bản scan"}
            </span>
          </div>

          <div className="space-y-3">
            {addendumDocuments.map(({ addendum, files }) => (
              <div
                key={addendum.id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      #{addendum.addendumCode}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {getAddendumTypeLabel(addendum.type, isEn)}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {files.length} {isEn ? "scans" : "tài liệu"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {files.map((url, fIdx) => (
                    <a
                      key={`addendum-${addendum.id}-${url}-${fIdx}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-[3/4] bg-white flex flex-col items-center justify-center p-2 text-center hover:border-teal-500 hover:shadow-sm transition-all block"
                    >
                      {url.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <FileText className="w-8 h-8 text-teal-600 mb-1" />
                          <span className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]">
                            PDF
                          </span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Addendum scan page ${fIdx + 1}`}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      <span className="absolute bottom-1.5 inset-x-1.5 bg-black/70 text-[9px] font-bold text-white py-0.5 rounded truncate px-1 text-center">
                        {isEn ? `Scan ${fIdx + 1}` : `Bản scan ${fIdx + 1}`}
                      </span>
                    </a>
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
