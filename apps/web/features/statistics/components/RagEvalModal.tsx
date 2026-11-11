"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, RotateCw, ShieldCheck, Target, Sparkles } from "lucide-react";
import { useRagEval } from "../hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RagEvalModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function RagEvalModal({ open, onOpenChange, trigger }: RagEvalModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [activeFilter, setActiveFilter] = useState<"all" | "passed" | "failed">("all");
  const { data, isLoading, isFetching, refetch } = useRagEval({
    enabled: currentOpen,
  });

  const summary = data?.summary;
  const cases = data?.cases || [];

  const filteredCases = cases.filter((c) => {
    if (activeFilter === "passed") return c.passed;
    if (activeFilter === "failed") return !c.passed;
    return true;
  });

  return (
    <Dialog open={currentOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Kiểm định chất lượng mô hình AI
                </DialogTitle>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Chạy lại kiểm định</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        {isLoading || isFetching ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-4 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              Đang thực thi bộ kịch bản kiểm chuẩn mô hình
            </h4>
          </div>
        ) : summary ? (
          <div className="space-y-6 pt-2">
            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {/* Overall Pass Rate */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-center">
                <div className="text-[11px] font-medium text-purple-700">Tỷ lệ đạt tổng thể</div>
                <div className="mt-1 text-xl font-black text-purple-900">
                  {summary.overallPassRatePercent}%
                </div>
                <div className="text-[10px] text-purple-600 font-semibold">
                  {summary.passedCases}/{summary.totalCases} kịch bản
                </div>
              </div>

              {/* Retrieval Hit Rate */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-center">
                <div className="text-[11px] font-medium text-teal-700">Truy xuất ngữ cảnh</div>
                <div className="mt-1 text-xl font-black text-teal-900">
                  {summary.retrievalHitRatePercent}%
                </div>
              </div>

              {/* Citation Faithfulness */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center">
                <div className="text-[11px] font-medium text-blue-700">Độ trung thực trích dẫn</div>
                <div className="mt-1 text-xl font-black text-blue-900">
                  {summary.citationFaithfulnessPercent}%
                </div>
              </div>

              {/* Router Accuracy */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-center">
                <div className="text-[11px] font-medium text-indigo-700">Định tuyến mô hình</div>
                <div className="mt-1 text-xl font-black text-indigo-900">
                  {summary.routerAccuracyPercent}%
                </div>
              </div>

              {/* Guardrail Defense */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                <div className="text-[11px] font-medium text-rose-700">Phòng vệ an toàn</div>
                <div className="mt-1 text-xl font-black text-rose-900">
                  {summary.guardrailDefenseRatePercent}%
                </div>
              </div>

              {/* Evaluated At */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-[11px] font-medium text-slate-500">Thời điểm đo</div>
                <div className="mt-1 text-xs font-bold text-slate-800">
                  {new Date(summary.evaluatedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-[10px] text-slate-400">
                  {new Date(summary.evaluatedAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "all"
                      ? "bg-purple-100 text-purple-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Tất cả ({cases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("passed")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "passed"
                      ? "bg-emerald-100 text-emerald-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Đạt ({summary.passedCases})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("failed")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "failed"
                      ? "bg-rose-100 text-rose-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Chưa đạt ({summary.totalCases - summary.passedCases})
                </button>
              </div>
            </div>

            {/* Cases list */}
            <div className="space-y-3">
              {filteredCases.map((testCase) => (
                <div
                  key={testCase.caseId}
                  className={`rounded-xl border p-3 text-xs transition-all ${
                    testCase.passed
                      ? "border-emerald-200/80 bg-emerald-50/20"
                      : "border-rose-200/80 bg-rose-50/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {testCase.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 mr-2">
                          {testCase.caseId}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                          {testCase.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        testCase.passed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {testCase.passed ? "Đạt" : "Không đạt"}
                    </span>
                  </div>

                  {/* Question */}
                  <p className="mt-2 font-semibold text-slate-800">
                    &ldquo;{testCase.question}&rdquo;
                  </p>

                  {/* Verification Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[10px]">
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                        testCase.retrievalHit
                          ? "bg-teal-50 border-teal-200 text-teal-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      <Target className="h-3 w-3" />
                      Truy xuất: {testCase.retrievalHit ? "Khớp" : "Không khớp"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                        testCase.citationFaithful
                          ? "bg-blue-50 border-blue-200 text-blue-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      Trích dẫn: {testCase.citationFaithful ? "Chuẩn xác" : "Không chuẩn xác"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                        testCase.routerMatched
                          ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      Định tuyến:{" "}
                      {testCase.actualComplexity === "complex" ? "Phức tạp" : "Đơn giản"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                        testCase.guardrailPassed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      Lá chắn an toàn: {testCase.guardrailPassed ? "Bảo vệ" : "Vi phạm"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            Chưa có kết quả kiểm định. Nhấn nút &ldquo;Chạy lại kiểm định&rdquo; ở góc phải để bắt
            đầu.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
