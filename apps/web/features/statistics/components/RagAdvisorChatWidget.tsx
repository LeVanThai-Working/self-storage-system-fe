"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertCircle,
  Bot,
  Database,
  HelpCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AiInsightFocusAreaEnum,
  RagGroundingStatusEnum,
  type RagAdvisorRequest,
  type RagAdvisorResponse,
  type StatisticsUserRole,
} from "../types";
import { useRagAdvisor } from "../hooks";
import { useStatisticsFilterStore } from "../store";
import { RagMarkdownContent } from "./RagMarkdownContent";
import { RagOpportunityMetricsCard } from "./RagOpportunityMetricsCard";
import { RagRecommendationCard } from "./RagRecommendationCard";
import { RagCitationsAccordion } from "./RagCitationsAccordion";
import { RagEvalModal } from "./RagEvalModal";
import { useAuthStore } from "@/features/auth/store";
import { useFacilities } from "@/features/facility-management/hooks";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text?: string;
  response?: RagAdvisorResponse;
  error?: string;
  errorCode?: string;
  timestamp: string;
}

let messageSeq = 0;
function createMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

function formatCurrentTimestamp(): string {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

const QUICK_PROMPTS = [
  {
    title: "Thu hồi nợ quá hạn",
    question: "Phân tích nợ quá hạn và đề xuất giải pháp thu hồi dòng tiền",
    focusArea: AiInsightFocusAreaEnum.DEBT_COLLECTION,
  },
  {
    title: "Thất thoát do bảo trì",
    question: "Các phòng kho đang bảo trì gây thất thoát bao nhiêu doanh thu",
    focusArea: AiInsightFocusAreaEnum.OPERATIONAL_EFFICIENCY,
  },
  {
    title: "Kích cầu kho trống",
    question: "Làm sao kích cầu giai đoạn thấp điểm và tăng tỷ lệ lấp đầy kho trống",
    focusArea: AiInsightFocusAreaEnum.OCCUPANCY,
  },
  {
    title: "Bán kèm tiện ích",
    question: "Đánh giá hiệu quả bán kèm tiện ích và nâng cao doanh thu mỗi phòng",
    focusArea: AiInsightFocusAreaEnum.REVENUE_GROWTH,
  },
];

interface RagAdvisorChatWidgetProps {
  role?: StatisticsUserRole;
  fromDate?: string;
  toDate?: string;
  facilityId?: string;
}

export function RagAdvisorChatWidget({
  role = "business_ops_manager",
  fromDate: propFromDate,
  toDate: propToDate,
  facilityId: propFacilityId,
}: RagAdvisorChatWidgetProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const storeFilters = useStatisticsFilterStore();
  const { data: facilitiesData } = useFacilities({ limit: 100 });

  // Effective sync values
  const effectiveFromDate = propFromDate ?? storeFilters.fromDate;
  const effectiveToDate = propToDate ?? storeFilters.toDate;
  const effectiveFacilityId =
    role === "facility_manager"
      ? (currentUser?.assignedFacilityId ?? currentUser?.facilityId ?? propFacilityId)
      : (propFacilityId ?? storeFilters.facilityId);

  // Widget states
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusArea, setFocusArea] = useState<AiInsightFocusAreaEnum>(
    storeFilters.focusArea || AiInsightFocusAreaEnum.ALL
  );
  const [inputQuestion, setInputQuestion] = useState("");
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Mutation
  const advisorMutation = useRagAdvisor();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, advisorMutation.isPending]);

  // Find facility name for display
  const facilityName = React.useMemo(() => {
    if (!effectiveFacilityId) return "Toàn chuỗi hệ thống";
    const fac = facilitiesData?.items?.find((f) => f.id === effectiveFacilityId);
    return fac ? fac.name : `Cơ sở: ${effectiveFacilityId.slice(-6)}`;
  }, [effectiveFacilityId, facilitiesData]);

  const handleSendMessage = useCallback(
    async (customQuestion?: string) => {
      const q = (customQuestion || inputQuestion).trim();
      if (!q || advisorMutation.isPending) return;

      if (q.length < 3) {
        toast.error("Câu hỏi phải có ít nhất 3 ký tự");
        return;
      }
      if (q.length > 1000) {
        toast.error("Câu hỏi không được vượt quá 1000 ký tự");
        return;
      }

      const userMsg: ChatMessage = {
        id: createMessageId("user"),
        sender: "user",
        text: q,
        timestamp: formatCurrentTimestamp(),
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!customQuestion) setInputQuestion("");

      const payload: RagAdvisorRequest = {
        question: q,
        focusArea,
        fromDate: effectiveFromDate,
        toDate: effectiveToDate,
        facilityId: effectiveFacilityId,
        refresh: false,
        topK: 5,
      };

      try {
        const result = await advisorMutation.mutateAsync(payload);
        const aiMsg: ChatMessage = {
          id: createMessageId("ai"),
          sender: "ai",
          response: result,
          timestamp: formatCurrentTimestamp(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: unknown) {
        const errObj = err as {
          response?: { data?: { messageCode?: string; message?: string } };
          messageCode?: string;
          message?: string;
        };
        const code = errObj?.response?.data?.messageCode || errObj?.messageCode;
        let errorText =
          errObj?.response?.data?.message || errObj?.message || "Đã xảy ra lỗi khi kết nối AI";

        if (code === "MESSAGE_CODE_821") {
          errorText =
            "Phát hiện lệnh can thiệp trái phép (Prompt Injection) hoặc chỉ thị không an toàn. Vui lòng đặt câu hỏi nghiệp vụ hợp lệ.";
        } else if (code === "MESSAGE_CODE_820") {
          errorText =
            "Khoảng thời gian thống kê không hợp lệ hoặc vượt quá 366 ngày. Vui lòng điều chỉnh lại bộ lọc ngày.";
        }

        const errorMsg: ChatMessage = {
          id: createMessageId("err"),
          sender: "ai",
          error: errorText,
          errorCode: code,
          timestamp: formatCurrentTimestamp(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [
      inputQuestion,
      advisorMutation,
      focusArea,
      effectiveFromDate,
      effectiveToDate,
      effectiveFacilityId,
    ]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCitationClick = (chunkId: string) => {
    setHighlightedChunkId(chunkId);
    toast.info("Đã chuyển đến nguồn trích dẫn");
    setTimeout(() => {
      const element = document.getElementById(`citation-${chunkId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast.success("Đã làm mới đoạn hội thoại");
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Mở Trợ lý AI RAG Advisor"
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-indigo-600 text-white shadow-xl shadow-teal-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/40 cursor-pointer"
          >
            {/* Ambient Pulsing Aura */}
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse" />

            <div className="relative flex items-center justify-center">
              <Bot className="h-7 w-7 text-white transition-transform group-hover:rotate-12" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 animate-bounce" />
            </div>

            {/* Tooltip on hover */}
            <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-xs opacity-0 transition-opacity group-hover:opacity-100">
              ⚡ Trợ lý AI Tư vấn Lợi nhuận
            </span>
          </button>
        </div>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-200 ${
            isExpanded
              ? "w-[94vw] max-w-2xl h-[86vh]"
              : "w-[94vw] sm:w-[420px] h-[620px] max-h-[88vh]"
          }`}
        >
          {/* Header */}
          <div className="flex flex-col border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-4 py-3 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-tight">
                      Trợ lý AI Tối ưu Lợi nhuận
                    </h3>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 text-slate-300">
                {/* Eval API trigger button for business ops and system admin */}
                {(role === "business_ops_manager" || role === "system_admin") && (
                  <button
                    type="button"
                    onClick={() => setIsEvalOpen(true)}
                    title="Chạy bộ kiểm chuẩn RAG (Eval Suite)"
                    className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </button>
                )}

                {/* Reset History */}
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Xóa lịch sử hội thoại"
                  className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Expand / Minimize toggle */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Thu nhỏ lại" : "Mở rộng cửa sổ"}
                  className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition-colors hidden sm:block cursor-pointer"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Đóng cửa sổ chat"
                  className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sync Badge & Focus Area Dropdown */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
              {/* Focus Area Select */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Trọng tâm:</span>
                <select
                  value={focusArea}
                  onChange={(e) => {
                    const val = e.target.value as AiInsightFocusAreaEnum;
                    setFocusArea(val);
                    storeFilters.setFocusArea(val);
                  }}
                  className="rounded-lg bg-white/10 border border-white/20 px-2 py-0.5 text-[11px] font-semibold text-white outline-none hover:bg-white/15 cursor-pointer"
                >
                  <option value={AiInsightFocusAreaEnum.ALL} className="text-slate-900">
                    Toàn diện
                  </option>
                  <option value={AiInsightFocusAreaEnum.REVENUE_GROWTH} className="text-slate-900">
                    Tăng doanh thu
                  </option>
                  <option value={AiInsightFocusAreaEnum.OCCUPANCY} className="text-slate-900">
                    Tối ưu lấp đầy
                  </option>
                  <option value={AiInsightFocusAreaEnum.DEBT_COLLECTION} className="text-slate-900">
                    Thu hồi nợ
                  </option>
                  <option
                    value={AiInsightFocusAreaEnum.OPERATIONAL_EFFICIENCY}
                    className="text-slate-900"
                  >
                    Hiệu quả vận hành
                  </option>
                </select>
              </div>

              {/* Synchronized Scope Badge */}
              <div
                className="flex items-center gap-1.5 text-[10px] text-teal-300/90 font-medium bg-teal-950/60 rounded-md px-2 py-0.5 border border-teal-500/30 truncate max-w-[210px]"
                title={`Đồng bộ Dashboard: ${facilityName} (${effectiveFromDate || "30 ngày trước"} - ${effectiveToDate || "nay"})`}
              >
                <Database className="h-3 w-3 shrink-0 text-teal-400" />
                <span className="truncate">{facilityName}</span>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* If no messages yet: Welcome & Quick Prompts */}
            {messages.length === 0 && (
              <div className="space-y-4 py-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-50 to-emerald-100 text-teal-700 border border-teal-200">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Xin chào! Tôi có thể giúp gì cho bạn?
                  </h4>
                </div>

                {/* Quick Prompts Pills */}
                <div className="space-y-1.5 pt-2 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Gợi ý câu hỏi nghiệp vụ
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFocusArea(prompt.focusArea);
                          handleSendMessage(prompt.question);
                        }}
                        className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left transition-all hover:border-teal-500 hover:bg-teal-50/40 hover:shadow-2xs cursor-pointer"
                      >
                        <span className="text-[11px] font-bold text-teal-800 group-hover:text-teal-900">
                          📌 {prompt.title}
                        </span>
                        <span className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          &ldquo;{prompt.question}&rdquo;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* User Message Bubble */}
                {msg.sender === "user" && (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-slate-900 px-3.5 py-2.5 text-xs text-white shadow-xs">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="mt-1 text-right text-[10px] text-slate-400">
                      {msg.timestamp}
                    </div>
                  </div>
                )}

                {/* AI Error Bubble */}
                {msg.sender === "ai" && msg.error && (
                  <div
                    className={`max-w-[95%] rounded-2xl rounded-tl-xs p-3.5 text-xs shadow-xs border ${
                      msg.errorCode === "MESSAGE_CODE_821"
                        ? "border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-300"
                        : "border-amber-300 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {msg.errorCode === "MESSAGE_CODE_821" ? (
                        <>
                          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>Cảnh báo an toàn dữ liệu</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Thông báo hệ thống</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed">{msg.error}</p>
                    <div className="mt-2 text-right text-[10px] text-slate-400">
                      {msg.timestamp}
                    </div>
                  </div>
                )}

                {/* AI Successful Response Bubble */}
                {msg.sender === "ai" && msg.response && (
                  <div className="w-full max-w-[98%] rounded-2xl rounded-tl-xs border border-slate-200 bg-white p-3.5 text-xs shadow-xs space-y-3">
                    {/* Edge-case Status Alerts */}
                    {msg.response.queryInfo.groundingStatus ===
                      RagGroundingStatusEnum.OUT_OF_SCOPE_REJECTED && (
                      <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-2.5 text-slate-700 text-xs flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-slate-500 shrink-0" />
                        <div>
                          <strong className="block font-semibold">
                            Câu hỏi ngoài phạm vi nghiệp vụ
                          </strong>
                          <span>
                            Trợ lý chỉ tập trung vào phân tích báo cáo và tối ưu lợi nhuận kho tự
                            quản.
                          </span>
                        </div>
                      </div>
                    )}

                    {msg.response.queryInfo.groundingStatus ===
                      RagGroundingStatusEnum.INSUFFICIENT_DATA && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-amber-900 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <div>
                          <strong className="block font-semibold">Dữ liệu ngoài hệ thống</strong>
                          <span>
                            Hệ thống không theo dõi các khoản chi phí ngoài hệ thống như tiền điện
                            nước, lương nhân sự hay chi phí tiếp thị.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Opportunity Metrics Banner */}
                    {msg.response.opportunityMetrics && (
                      <RagOpportunityMetricsCard metrics={msg.response.opportunityMetrics} />
                    )}

                    {/* Answer Markdown Content */}
                    <div className="text-slate-800 text-left">
                      <RagMarkdownContent
                        content={msg.response.answer}
                        onCitationClick={handleCitationClick}
                      />
                    </div>

                    {/* Recommendations List */}
                    {msg.response.recommendations && msg.response.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Hành động khuyến nghị ({msg.response.recommendations.length})
                        </div>
                        <div className="space-y-2">
                          {msg.response.recommendations.map((rec) => (
                            <RagRecommendationCard
                              key={rec.id}
                              item={rec}
                              onCitationClick={handleCitationClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Citations Accordion */}
                    {msg.response.citations && msg.response.citations.length > 0 && (
                      <RagCitationsAccordion
                        citations={msg.response.citations}
                        highlightedChunkId={highlightedChunkId}
                      />
                    )}

                    {/* Timestamp */}
                    <div className="text-right text-[10px] text-slate-400 pt-1">
                      {msg.timestamp}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading Animation */}
            {advisorMutation.isPending && (
              <div className="flex items-start gap-2.5 max-w-[85%] rounded-2xl rounded-tl-xs border border-teal-200 bg-teal-50/50 p-3 text-xs text-teal-900">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white shrink-0 animate-pulse">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-teal-800">
                    <span>Đang truy xuất ngữ cảnh và tính toán...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <div className="border-t border-slate-200/90 bg-white p-3 rounded-b-2xl">
            {/* AI Disclaimer */}
            <p className="mb-2 text-center text-[11px] text-slate-400 select-none">
              Thông tin từ AI có thể sai lệch, hãy kiểm tra trước khi sử dụng
            </p>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về nợ quá hạn, lấp đầy kho, thất thoát sửa chữa... (Enter để gửi)"
                  rows={2}
                  maxLength={1000}
                  disabled={advisorMutation.isPending}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all pr-12"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuestion.trim() || advisorMutation.isPending}
                  className="absolute bottom-3 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs transition-all hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Gửi câu hỏi"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Bottom Info: Char Count */}
              <div className="flex justify-end text-[10px] text-slate-400 font-mono px-1">
                {inputQuestion.length}/1000 ký tự
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAG Golden Dataset Eval Modal */}
      <RagEvalModal open={isEvalOpen} onOpenChange={setIsEvalOpen} />
    </>
  );
}
