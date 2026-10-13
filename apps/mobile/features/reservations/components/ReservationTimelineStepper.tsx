import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Ban,
  Timer,
  RefreshCw,
  UserCheck,
  QrCode,
} from "lucide-react-native";
import {
  ReservationStatusEnum,
  type ContractResponse,
  type MessageLocale,
  type ReservationResponse,
} from "@self-storage-system-fe/shared";
import { buildReservationTimeline, formatDateTime, formatVnd } from "../utils/reservationFormat";

interface ReservationTimelineStepperProps {
  reservation: ReservationResponse;
  linkedContract?: ContractResponse | null;
  locale?: MessageLocale;
  countdownFormatted?: string;
  isExpiredCountdown?: boolean;
  onPayDepositPress?: () => void;
  onRetryPaymentPress?: () => void;
  isRetryingPayment?: boolean;
}

export function ReservationTimelineStepper({
  reservation,
  linkedContract,
  locale = "vi",
  countdownFormatted,
  isExpiredCountdown = false,
  onPayDepositPress,
  onRetryPaymentPress,
  isRetryingPayment = false,
}: ReservationTimelineStepperProps) {
  const isEn = locale === "en";
  const { steps, terminalNode } = buildReservationTimeline(reservation, locale, linkedContract);

  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Clock size={18} color="#0B927E" />
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {isEn ? "Reservation Progress (6 Steps)" : "Tiến trình đặt chỗ (6 bước)"}
          </Text>
        </View>

        {countdownFormatted && !isExpiredCountdown ? (
          <Badge variant="outline" className="border-cta/50 bg-cta-light/30 px-2.5 py-1">
            <View className="flex-row items-center gap-1">
              <Timer size={12} color="#FF702E" />
              <Text className="text-[11px] font-bold text-cta">
                {isEn ? "Hold left:" : "Giữ chỗ:"} {countdownFormatted}
              </Text>
            </View>
          </Badge>
        ) : null}
      </View>

      <View className="pl-1">
        {steps.map((step, index) => {
          const isLastStep = index === steps.length - 1 && !terminalNode;
          const isCompleted = step.state === "completed";
          const isCurrent = step.state === "current";
          const isWarning = step.state === "warning";

          return (
            <View key={`${step.stepNumber}-${step.state}`} className="flex-row">
              {/* Left column: Circle + vertical connector line */}
              <View className="items-center mr-3.5" style={{ width: 28 }}>
                <View
                  className={`h-7 w-7 rounded-full items-center justify-center border-2 ${
                    isCompleted
                      ? "bg-brand border-brand"
                      : isWarning
                        ? "bg-red-50 dark:bg-red-950 border-red-500"
                        : isCurrent
                          ? "bg-brand-light/50 dark:bg-brand/25 border-brand"
                          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={15} color="#FFFFFF" />
                  ) : isWarning ? (
                    <AlertTriangle size={14} color="#EF4444" />
                  ) : (
                    <Text
                      className={`text-xs font-extrabold ${
                        isCurrent ? "text-brand" : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {step.stepNumber}
                    </Text>
                  )}
                </View>

                {!isLastStep && (
                  <View
                    className={`w-0.5 flex-1 my-1 ${
                      isCompleted ? "bg-brand" : "bg-neutral-200 dark:bg-neutral-800"
                    }`}
                    style={{ minHeight: 24 }}
                  />
                )}
              </View>

              {/* Right column: Step details */}
              <View className={`flex-1 ${isLastStep ? "pb-1" : "pb-4"}`}>
                <View className="flex-row items-center justify-between flex-wrap gap-1.5">
                  <Text
                    className={`text-xs font-bold ${
                      isCompleted || isCurrent
                        ? "text-neutral-dark dark:text-neutral-100"
                        : isWarning
                          ? "text-red-600 dark:text-red-400"
                          : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {isEn ? `Step ${step.stepNumber}: ` : `Bước ${step.stepNumber}: `}
                    {step.title}
                  </Text>

                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 ${
                        isCompleted
                          ? "border-brand/40 bg-brand-light/30"
                          : isWarning
                            ? "border-red-300 bg-red-50 dark:bg-red-950/40"
                            : isCurrent
                              ? "border-cta/50 bg-cta-light/30"
                              : "border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isCompleted
                            ? "text-brand"
                            : isWarning
                              ? "text-red-600 dark:text-red-400"
                              : isCurrent
                                ? "text-cta"
                                : "text-neutral-400 dark:text-neutral-500"
                        }`}
                      >
                        {isCompleted
                          ? isEn
                            ? "Completed"
                            : "Đã hoàn thành"
                          : isWarning
                            ? isEn
                              ? "Payment issue"
                              : "Thanh toán lỗi"
                            : isCurrent
                              ? isEn
                                ? "In progress"
                                : "Đang xử lý"
                              : isEn
                                ? "Upcoming"
                                : "Chờ thực hiện"}
                      </Text>
                    </Badge>

                    {step.extraBadge ? (
                      <Badge
                        variant="outline"
                        className="border-brand/40 bg-brand-light/30 px-2 py-0.5"
                      >
                        <Text className="text-[10px] font-bold text-brand">{step.extraBadge}</Text>
                      </Badge>
                    ) : null}
                  </View>
                </View>

                <Text
                  className={`mt-0.5 text-[11px] leading-4 ${
                    step.state === "upcoming"
                      ? "text-neutral-400 dark:text-neutral-600"
                      : "text-neutral-main dark:text-neutral-400"
                  }`}
                >
                  {step.description}
                </Text>

                {/* Timestamp & Staff Actor */}
                {(step.timestamp || step.actorName) && step.state !== "upcoming" ? (
                  <View className="mt-1.5 flex-row flex-wrap items-center gap-3">
                    {step.timestamp ? (
                      <Text className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                        {formatDateTime(step.timestamp)}
                      </Text>
                    ) : null}
                    {step.actorName ? (
                      <View className="flex-row items-center gap-1">
                        <UserCheck size={11} color="#0B927E" />
                        <Text className="text-[10px] font-semibold text-brand">
                          {step.actorName}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Step 3 Action Button: Pay Deposit & Show VietQR when status === PENDING_PAYMENT */}
                {step.stepNumber === 3 &&
                isCurrent &&
                reservation.status === ReservationStatusEnum.PENDING_PAYMENT &&
                onPayDepositPress ? (
                  <Pressable
                    onPress={onPayDepositPress}
                    className="mt-2.5 flex-row items-center justify-center gap-2 self-start rounded-xl bg-cta px-3.5 py-2 shadow-sm active:opacity-85"
                  >
                    <QrCode size={14} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      {isEn
                        ? `Pay Deposit (${formatVnd(reservation.depositAmount)}) • Show QR`
                        : `Thanh toán cọc (${formatVnd(reservation.depositAmount)}) • Hiển thị mã QR`}
                    </Text>
                  </Pressable>
                ) : null}

                {/* PAYMENT_FAILED Warning Box at Step 3 */}
                {isWarning && step.errorText ? (
                  <View className="mt-2.5 rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50/90 dark:bg-red-950/40 p-3">
                    <Text className="text-xs font-semibold text-red-700 dark:text-red-300 leading-4">
                      {step.errorText}
                    </Text>
                    {onRetryPaymentPress ? (
                      <Pressable
                        onPress={onRetryPaymentPress}
                        disabled={isRetryingPayment}
                        className="mt-2.5 flex-row items-center justify-center gap-1.5 self-start rounded-lg bg-cta px-3 py-1.5 active:opacity-85"
                      >
                        <RefreshCw size={12} color="#FFFFFF" />
                        <Text className="text-[11px] font-bold text-white">
                          {isEn
                            ? "Retry Deposit Payment (Show QR)"
                            : "Thanh toán lại ngay (Hiển thị mã QR)"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}

        {/* Terminal Node for REJECTED / CANCELLED / EXPIRED (Section 4.2 Case C) */}
        {terminalNode ? (
          <View className="flex-row">
            <View className="items-center mr-3.5" style={{ width: 28 }}>
              <View
                className={`h-7 w-7 rounded-full items-center justify-center border-2 ${
                  terminalNode.type === "rejected"
                    ? "bg-red-600 border-red-600"
                    : terminalNode.type === "cancelled"
                      ? "bg-amber-600 border-amber-600"
                      : "bg-neutral-500 border-neutral-500"
                }`}
              >
                {terminalNode.type === "rejected" ? (
                  <XCircle size={15} color="#FFFFFF" />
                ) : terminalNode.type === "cancelled" ? (
                  <Ban size={14} color="#FFFFFF" />
                ) : (
                  <Clock size={14} color="#FFFFFF" />
                )}
              </View>
            </View>

            <View className="flex-1 pb-1">
              <View
                className={`rounded-2xl border p-3 ${
                  terminalNode.type === "rejected"
                    ? "border-red-200 dark:border-red-900/70 bg-red-50/80 dark:bg-red-950/35"
                    : terminalNode.type === "cancelled"
                      ? "border-amber-200 dark:border-amber-900/70 bg-amber-50/80 dark:bg-amber-950/35"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-800/60"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    terminalNode.type === "rejected"
                      ? "text-red-700 dark:text-red-300"
                      : terminalNode.type === "cancelled"
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-neutral-700 dark:text-neutral-200"
                  }`}
                >
                  {terminalNode.title}
                </Text>

                <Text className="mt-1 text-xs text-neutral-700 dark:text-neutral-300 leading-4">
                  {isEn ? "Reason: " : "Lý do: "}
                  {terminalNode.reason}
                </Text>

                {terminalNode.type === "cancelled" &&
                typeof terminalNode.refundAmount === "number" ? (
                  <View className="mt-2 flex-row items-center justify-between border-t border-amber-200/70 dark:border-amber-800/60 pt-2">
                    <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {isEn ? "Refunded Deposit:" : "Số tiền hoàn cọc:"}
                    </Text>
                    <Text className="text-xs font-extrabold text-brand">
                      {formatVnd(terminalNode.refundAmount)}
                    </Text>
                  </View>
                ) : null}

                {terminalNode.timestamp ? (
                  <Text className="mt-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                    {formatDateTime(terminalNode.timestamp)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
