"use client";

import React, { useState } from "react";
import { Building2, ChevronDown, ChevronUp, Coins, FileText, ListOrdered } from "lucide-react";
import { AiInsightCategoryEnum, AiInsightPriorityEnum, type AiRecommendationItem } from "../types";
import { sanitizeVietnameseText } from "../utils/sanitizeText";

interface RagRecommendationCardProps {
  item: AiRecommendationItem;
  onCitationClick?: (chunkId: string) => void;
}

const formatVND = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
};

const getCategoryLabel = (category: AiInsightCategoryEnum): string => {
  switch (category) {
    case AiInsightCategoryEnum.PRICING_AND_PROMOTION:
      return "Chiến lược giá và khuyến mãi";
    case AiInsightCategoryEnum.OCCUPANCY_AND_CAPACITY:
      return "Công suất và lấp đầy";
    case AiInsightCategoryEnum.UPSELL_AND_PRODUCT_MIX:
      return "Bán kèm tiện ích";
    case AiInsightCategoryEnum.CASHFLOW_AND_DEBT:
      return "Dòng tiền và thu hồi nợ";
    case AiInsightCategoryEnum.OPERATIONS_AND_SLA:
      return "Quy trình vận hành";
    default:
      return category;
  }
};

const getPriorityStyle = (priority: AiInsightPriorityEnum) => {
  switch (priority) {
    case AiInsightPriorityEnum.HIGH:
      return {
        badge: "bg-rose-100 text-rose-800 border-rose-300",
        container: "border-rose-200/80 bg-rose-50/20 hover:border-rose-300",
        label: "Ưu tiên cao",
        tagColor: "text-rose-700",
      };
    case AiInsightPriorityEnum.MEDIUM:
      return {
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        container: "border-amber-200/80 bg-amber-50/20 hover:border-amber-300",
        label: "Ưu tiên trung bình",
        tagColor: "text-amber-700",
      };
    case AiInsightPriorityEnum.LOW:
    default:
      return {
        badge: "bg-blue-100 text-blue-800 border-blue-300",
        container: "border-blue-200/80 bg-blue-50/20 hover:border-blue-300",
        label: "Ưu tiên thấp",
        tagColor: "text-blue-700",
      };
  }
};

export function RagRecommendationCard({ item, onCitationClick }: RagRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const style = getPriorityStyle(item.priority);
  const sanitizedTitle = sanitizeVietnameseText(item.title);
  const sanitizedEvidence = sanitizeVietnameseText(item.dataEvidence);
  const sanitizedImpact = sanitizeVietnameseText(item.expectedProfitImpact);

  // Helper to highlight citations in evidence
  const renderEvidence = (text: string) => {
    const regex = /(\[CHUNK-[A-Z0-9_\-]+\])/g;
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      if (part.startsWith("[CHUNK-") && part.endsWith("]")) {
        const chunkId = part.slice(1, -1);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onCitationClick?.(chunkId)}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-teal-100/70 border border-teal-300 text-teal-900 text-[10px] font-bold hover:bg-teal-200 transition-colors align-middle cursor-pointer"
          >
            <FileText className="w-2.5 h-2.5" />
            <span>{chunkId}</span>
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      className={`rounded-xl border p-3 transition-all shadow-2xs my-2 text-left ${style.container}`}
    >
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
            >
              {style.label}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              {getCategoryLabel(item.category)}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
            {sanitizedTitle}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title={isExpanded ? "Thu gọn" : "Mở rộng"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Financial impact preview */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {item.estimatedImpactVnd > 0 && (
          <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-800 border border-emerald-200">
            <Coins className="h-3.5 w-3.5 text-emerald-600" />
            <span>+{formatVND(item.estimatedImpactVnd)}</span>
          </div>
        )}
        {sanitizedImpact && (
          <span className="text-[11px] font-medium text-slate-600">{sanitizedImpact}</span>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-2.5 space-y-2 border-t border-slate-200/60 pt-2 text-xs">
          {/* Data evidence */}
          {sanitizedEvidence && (
            <div className="rounded-lg bg-white/80 p-2 border border-slate-200/60">
              <div className="flex items-center gap-1 font-semibold text-slate-700 mb-0.5 text-[11px]">
                <FileText className="h-3 w-3 text-slate-500" />
                <span>Căn cứ dữ liệu:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {renderEvidence(sanitizedEvidence)}
              </p>
            </div>
          )}

          {/* Action Steps */}
          {item.actionSteps && item.actionSteps.length > 0 && (
            <div>
              <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1 text-[11px]">
                <ListOrdered className="h-3 w-3 text-teal-600" />
                <span>Các bước triển khai:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-700 leading-normal">
                {item.actionSteps.map((step, idx) => (
                  <li key={idx}>{sanitizeVietnameseText(step)}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Target Facility Codes */}
          {item.targetFacilityCodes && item.targetFacilityCodes.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 text-[10px]">
              <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-slate-500">Cơ sở áp dụng:</span>
              <div className="flex flex-wrap gap-1">
                {item.targetFacilityCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700 border border-slate-200"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
