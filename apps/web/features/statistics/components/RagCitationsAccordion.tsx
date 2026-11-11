"use client";

import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { RAG_CHUNK_TYPE_LABELS_VN, type RagChunkCitation } from "../types";
import { sanitizeVietnameseText } from "../utils/sanitizeText";

interface RagCitationsAccordionProps {
  citations: RagChunkCitation[];
  highlightedChunkId?: string | null;
}

export function RagCitationsAccordion({
  citations,
  highlightedChunkId,
}: RagCitationsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-teal-600" />
          <span>Bằng chứng trích dẫn nguồn ({citations.length})</span>
          <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[10px] font-bold text-teal-800">
            Minh bạch
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[11px]">{isOpen ? "Ẩn bớt" : "Xem nguồn"}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-slate-200/80 p-3 bg-white">
          {citations.map((cite, idx) => {
            const isTargeted = highlightedChunkId === cite.chunkId;
            const scorePercent = Math.round(cite.relevanceScore * 100);

            return (
              <div
                key={cite.chunkId || idx}
                id={`citation-${cite.chunkId}`}
                className={`rounded-lg border p-2.5 transition-all text-xs ${
                  isTargeted
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-400/40"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-teal-50 border border-teal-200 font-semibold text-[10px] text-teal-800 px-2 py-0.5 shrink-0">
                      Nguồn {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {sanitizeVietnameseText(cite.title)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                      {sanitizeVietnameseText(
                        RAG_CHUNK_TYPE_LABELS_VN[cite.category] || cite.category
                      )}
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
                      <ShieldCheck className="h-3 w-3" />
                      {scorePercent}% phù hợp
                    </span>
                  </div>
                </div>

                {/* Excerpt quote */}
                <blockquote className="rounded border-l-2 border-teal-500 bg-white p-2 text-[11px] text-slate-600 italic">
                  &ldquo;{sanitizeVietnameseText(cite.excerpt)}&rdquo;
                </blockquote>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
