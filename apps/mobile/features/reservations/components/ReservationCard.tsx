import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import {
  ContractStatusEnum,
  ReservationStatusEnum,
  type ContractResponse,
  type MessageLocale,
  type ReservationResponse,
} from "@self-storage-system-fe/shared";
import {
  Building2,
  Calendar,
  Boxes,
  QrCode,
  ChevronRight,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react-native";
import { getContractStatusMeta } from "@/features/contracts/utils/contractFormat";
import {
  formatDateShort,
  formatDateTime,
  formatRentalDurationDays,
  formatVnd,
  getReservationStatusMeta,
} from "../utils/reservationFormat";

interface ReservationCardProps {
  reservation: ReservationResponse;
  linkedContract?: ContractResponse | null;
  locale?: MessageLocale;
  onPress: (reservation: ReservationResponse) => void;
  onPayDepositPress?: (reservation: ReservationResponse) => void;
  onViewContractPress?: (contract: ContractResponse) => void;
}

export function ReservationCard({
  reservation,
  linkedContract,
  locale = "vi",
  onPress,
  onPayDepositPress,
  onViewContractPress,
}: ReservationCardProps) {
  const isEn = locale === "en";
  const statusMeta = getReservationStatusMeta(reservation.status, locale);
  const contractStatusMeta = linkedContract
    ? getContractStatusMeta(linkedContract.status, locale)
    : null;

  const isPendingPayment = reservation.status === ReservationStatusEnum.PENDING_PAYMENT;
  const isPaymentFailed = reservation.status === ReservationStatusEnum.PAYMENT_FAILED;

  return (
    <Pressable
      onPress={() => onPress(reservation)}
      className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm active:opacity-95"
    >
      {/* Header: Reservation Code & Status Badge */}
      <View className="flex-row items-start justify-between gap-2 mb-2.5">
        <View className="flex-1">
          <Text className="text-xs font-extrabold tracking-wide text-neutral-dark dark:text-neutral-100">
            #{reservation.reservationCode}
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: statusMeta.dotColor }}
            />
            <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {linkedContract?.status === ContractStatusEnum.DRAFT
                ? isEn
                  ? "Step 6/6: Contract Created (Awaiting Check-in)"
                  : "Bước 6/6: Đã tạo hợp đồng"
                : statusMeta.compactStepLabel}
            </Text>
          </View>
        </View>

        <Badge
          variant="outline"
          className={`${statusMeta.badgeBorderClass} ${statusMeta.badgeBgClass} px-2.5 py-1`}
        >
          <Text className={`text-[11px] font-bold ${statusMeta.badgeTextClass}`}>
            {statusMeta.label}
          </Text>
        </Badge>
      </View>

      {/* Body: Facility, Schedule, Physical Unit & Pricing */}
      <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3 gap-2 mb-3">
        <View className="flex-row items-center gap-2">
          <Building2 size={14} color="#0B927E" />
          <Text
            className="text-xs font-bold text-neutral-dark dark:text-neutral-100 flex-1"
            numberOfLines={1}
          >
            {reservation.facility?.name || (isEn ? "Storage Facility" : "Cơ sở lưu trữ")}
            {reservation.facility?.city ? ` • ${reservation.facility.city}` : ""}
          </Text>
        </View>

        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <View className="flex-row items-center gap-1.5">
            <Calendar size={13} color="#647B80" />
            <Text variant="muted" className="text-xs">
              {isEn ? "Start:" : "Nhận kho:"}{" "}
              <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                {formatDateShort(reservation.startDate)}
              </Text>
            </Text>
          </View>

          <Text variant="muted" className="text-xs">
            {isEn ? "Duration:" : "Thời hạn:"}{" "}
            <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
              {formatRentalDurationDays(reservation.rentalDuration, locale)}
            </Text>
          </Text>
        </View>

        {reservation.storageUnit ? (
          <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2">
            <View className="flex-row items-center gap-1.5">
              <Boxes size={13} color="#0B927E" />
              <Text variant="muted" className="text-xs">
                {isEn ? "Assigned Unit:" : "Phòng kho được gán:"}
              </Text>
            </View>
            <Badge variant="outline" className="border-brand/40 bg-brand-light/30 px-2 py-0.5">
              <Text className="text-[11px] font-extrabold text-brand">
                #{reservation.storageUnit.unitNumber} (
                {isEn
                  ? `Fl. ${reservation.storageUnit.floor}`
                  : `Tầng ${reservation.storageUnit.floor}`}
                )
              </Text>
            </Badge>
          </View>
        ) : null}

        {linkedContract && contractStatusMeta ? (
          <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <FileText size={13} color="#0B927E" />
              <Text
                className="text-xs font-bold text-neutral-dark dark:text-neutral-100"
                numberOfLines={1}
              >
                {isEn ? "Contract:" : "Hợp đồng:"} #{linkedContract.contractCode}
              </Text>
            </View>
            <Badge
              variant="outline"
              className={`${contractStatusMeta.badgeBorderClass} ${contractStatusMeta.badgeBgClass} px-2 py-0.5`}
            >
              <Text className={`text-[10px] font-bold ${contractStatusMeta.badgeTextClass}`}>
                {contractStatusMeta.label}
              </Text>
            </Badge>
          </View>
        ) : null}

        {isPendingPayment && reservation.expiresAt ? (
          <View className="flex-row items-center gap-1.5 border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2">
            <Clock size={12} color="#FF702E" />
            <Text className="text-[11px] font-semibold text-cta flex-1">
              {isEn ? "Payment deadline:" : "Hạn đặt cọc:"} {formatDateTime(reservation.expiresAt)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer: Deposit & Total + Quick Action */}
      <View className="flex-row items-center justify-between gap-2">
        <View>
          <Text variant="muted" className="text-[11px]">
            {isEn ? "Deposit:" : "Tiền cọc:"}{" "}
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
              {formatVnd(reservation.depositAmount)}
            </Text>
          </Text>
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100 mt-0.5">
            {isEn ? "Total:" : "Tổng đơn:"}{" "}
            <Text className="text-sm font-extrabold text-brand">
              {formatVnd(reservation.totalAmount)}
            </Text>
          </Text>
        </View>

        {(isPendingPayment || isPaymentFailed) && onPayDepositPress ? (
          <Pressable
            onPress={() => onPayDepositPress(reservation)}
            className="flex-row items-center gap-1.5 rounded-xl bg-cta px-3.5 py-2.5 shadow-sm active:opacity-85"
          >
            {isPaymentFailed ? (
              <RefreshCw size={14} color="#FFFFFF" />
            ) : (
              <QrCode size={14} color="#FFFFFF" />
            )}
            <Text className="text-xs font-bold text-white">
              {isPaymentFailed
                ? isEn
                  ? "Retry Deposit"
                  : "Thanh toán lại"
                : isEn
                  ? "Pay Deposit"
                  : "Thanh toán cọc"}
            </Text>
          </Pressable>
        ) : linkedContract && onViewContractPress ? (
          <Pressable
            onPress={() => onViewContractPress(linkedContract)}
            className="flex-row items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 shadow-sm active:opacity-85"
          >
            <FileText size={14} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">
              {linkedContract.status === ContractStatusEnum.DRAFT
                ? isEn
                  ? "View Check-in Contract"
                  : "Xem hợp đồng"
                : isEn
                  ? "View Contract"
                  : "Xem hợp đồng"}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center gap-1 rounded-xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
            <Text className="text-xs font-semibold text-brand">
              {isEn ? "View Detail" : "Xem chi tiết"}
            </Text>
            <ChevronRight size={14} color="#0B927E" />
          </View>
        )}
      </View>
    </Pressable>
  );
}
