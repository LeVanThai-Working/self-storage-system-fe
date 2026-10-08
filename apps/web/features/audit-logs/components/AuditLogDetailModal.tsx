"use client";

import React from "react";
import { useAuditLog } from "../hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Server,
  Monitor,
  Route,
  Calendar,
  User,
  Shield,
  Activity,
  AlertCircle,
  Network,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

const ACTION_COLORS: Record<string, string> = {
  login: "bg-blue-50 text-blue-700 border-blue-200",
  login_google: "bg-blue-50 text-blue-700 border-blue-200",
  logout: "bg-slate-50 text-slate-700 border-slate-200",
  register: "bg-teal-50 text-teal-700 border-teal-200",
  create: "bg-teal-50 text-teal-700 border-teal-200",
  update: "bg-orange-50 text-orange-600 border-orange-200",
  delete: "bg-rose-50 text-rose-700 border-rose-200",
  restore: "bg-teal-50 text-teal-700 border-teal-200",
  approve: "bg-teal-50 text-teal-700 border-teal-200",
  reject: "bg-red-50 text-red-700 border-red-200",
  cancel: "bg-red-50 text-red-600 border-red-200",
  assign_manager: "bg-purple-50 text-purple-700 border-purple-200",
};

interface AuditLogDetailModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (iso: string, locale: string) => {
  return new Date(iso).toLocaleString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const AuditLogDetailModal = ({ id, isOpen, onClose }: AuditLogDetailModalProps) => {
  const t = useTranslations("systemAdmin.auditLog");
  const locale = useLocale();
  const { data: log, isLoading, isError } = useAuditLog(id || "", { enabled: !!id && isOpen });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="pr-10 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {t("modal.title")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                <span>{t("modal.logId")}:</span>
                <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs select-all">
                  {id}
                </span>
              </DialogDescription>
            </div>
            {log && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    log.status === "success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      log.status === "success" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  {log.status === "success" ? t("success") : t("failure")}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : isError || !log ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <AlertCircle className="w-10 h-10 text-red-300" />
            <p className="text-sm">{t("modal.errorMessage")}</p>
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {/* ─── THÔNG TIN TỔNG QUAN ─── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-semibold text-slate-800">{t("modal.overview")}</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
                  {/* ACTOR */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-teal-50 text-teal-600 rounded-full border border-teal-100">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t("modal.actor")}
                      </dt>
                      <dd className="text-sm text-slate-900 font-medium mt-1 min-w-0">
                        {log.actorEmail ? (
                          <div className="min-w-0">
                            <div
                              className="text-slate-800 text-base font-medium truncate"
                              title={log.actorEmail}
                            >
                              {log.actorEmail}
                            </div>
                            {log.actorRole && (
                              <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 mt-1.5 uppercase tracking-wider truncate max-w-full">
                                {log.actorRole.replace(/_/g, " ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">{t("guest")}</span>
                        )}
                      </dd>
                    </div>
                  </div>

                  {/* ACTION & RESOURCE */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-orange-50 text-orange-500 rounded-full border border-orange-100">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t("modal.action")}
                      </dt>
                      <dd className="flex flex-col items-start gap-2 mt-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border truncate ${ACTION_COLORS[log.action] || "bg-slate-50 text-slate-700 border-slate-200"}`}
                          >
                            {t(`actions.${log.action}` as Parameters<typeof t>[0]) || log.action}
                          </span>
                          <span className="text-slate-400 text-xs italic shrink-0">
                            {t("modal.on")}
                          </span>
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-teal-50 text-teal-700 border border-teal-100 truncate max-w-full">
                            {t(`resources.${log.resourceType}` as Parameters<typeof t>[0]) ||
                              log.resourceType}
                          </span>
                        </div>
                        {log.resourceId && (
                          <div className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200 mt-1 break-all w-full">
                            ID: {log.resourceId}
                          </div>
                        )}
                      </dd>
                    </div>
                  </div>

                  {/* TIME */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t("modal.time")}
                      </dt>
                      <dd className="text-base text-slate-800 font-medium mt-1">
                        {formatDate(log.createdAt, locale)}
                      </dd>
                    </div>
                  </div>

                  {/* IP & REQUEST */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                      <Network className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t("modal.ipAndRequest")}
                      </dt>
                      <dd className="text-base font-mono text-slate-800 font-medium mt-1 min-w-0">
                        {log.ip ? (
                          <div className="truncate" title={log.ip}>
                            {log.ip}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 font-sans">N/A</span>
                        )}
                        {log.requestId && (
                          <div className="text-xs text-slate-400 font-mono mt-1.5 font-normal bg-slate-50 px-2 py-1 rounded-md border border-slate-200 break-all w-full">
                            Req: {log.requestId}
                          </div>
                        )}
                      </dd>
                    </div>
                  </div>

                  {/* ENDPOINT */}
                  <div className="flex items-start gap-4 md:col-span-2 border-t border-slate-100 pt-7 mt-1 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      <Route className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t("modal.endpoint")}
                      </dt>
                      <dd className="flex items-center gap-3 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 min-w-0">
                        {log.method || log.path ? (
                          <>
                            {log.method && (
                              <span
                                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider ${
                                  log.method === "GET"
                                    ? "bg-blue-100 text-blue-700"
                                    : log.method === "POST"
                                      ? "bg-teal-100 text-teal-700"
                                      : log.method === "PUT" || log.method === "PATCH"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                              >
                                {log.method}
                              </span>
                            )}
                            <span
                              className="text-base text-slate-800 font-mono font-medium truncate"
                              title={log.path || ""}
                            >
                              {log.path || ""}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 font-sans">N/A</span>
                        )}
                      </dd>
                    </div>
                  </div>

                  {/* USER AGENT */}
                  <div className="flex items-start gap-4 md:col-span-2 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {t("modal.userAgent")}
                      </dt>
                      <dd className="text-sm text-slate-600 font-mono leading-relaxed break-words bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-1 w-full">
                        {log.userAgent || (
                          <span className="font-sans text-xs text-slate-400 font-medium">N/A</span>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── DỮ LIỆU THAY ĐỔI (DIFF) ─── */}
            {(log.changes?.before || log.changes?.after) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-semibold text-slate-800">{t("modal.dataDiff")}</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-rose-100 overflow-hidden shadow-sm">
                    <div className="bg-rose-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-700 border-b border-rose-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      {t("modal.before")}
                    </div>
                    <div className="bg-white p-4 overflow-x-auto h-[250px] overflow-y-auto custom-scrollbar">
                      <pre className="text-[12px] text-slate-700 font-mono leading-relaxed">
                        {log.changes.before ? (
                          JSON.stringify(log.changes.before, null, 2)
                        ) : (
                          <span className="italic text-slate-400">{t("modal.none")}</span>
                        )}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-100 overflow-hidden shadow-sm">
                    <div className="bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      {t("modal.after")}
                    </div>
                    <div className="bg-white p-4 overflow-x-auto h-[250px] overflow-y-auto custom-scrollbar">
                      <pre className="text-[12px] text-slate-700 font-mono leading-relaxed">
                        {log.changes.after ? (
                          JSON.stringify(log.changes.after, null, 2)
                        ) : (
                          <span className="italic text-slate-400">{t("modal.none")}</span>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata (if any) */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                  <Server className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-semibold text-slate-800">{t("modal.metadata")}</h3>
                </div>
                <div className="p-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-[11px] text-slate-600 font-mono">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
