import React, { useState } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import {
  ContractSourceEnum,
  ContractStatusEnum,
  type ContractResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import {
  Boxes,
  Building2,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Droplets,
  KeyRound,
  Lock,
  Sparkles,
  Thermometer,
  Video,
} from "lucide-react-native";
import {
  formatDateShort,
  formatVnd,
  getContractDurationDays,
  getContractSourceLabel,
  getContractStatusMeta,
  getRemainingDays,
  getRentalUnitLabel,
} from "../utils/contractFormat";

interface ContractCardProps {
  contract: ContractResponse;
  locale: MessageLocale;
  facilityName?: string;
  unitNumber?: string;
  onPress: (contract: ContractResponse) => void;
  onUnlockPress?: (contract: ContractResponse) => void;
  onViewPinPress?: (contract: ContractResponse) => void;
  isUnlocking?: boolean;
}

export function ContractCard({
  contract,
  locale,
  facilityName,
  unitNumber,
  onPress,
  onUnlockPress,
  onViewPinPress,
  isUnlocking = false,
}: ContractCardProps) {
  const isEn = locale === "en";
  const statusMeta = getContractStatusMeta(contract.status, locale);
  const [mountNowMs] = useState(() => Date.now());

  const remainingDays = getRemainingDays(contract.endDate, mountNowMs);
  const durationDays = getContractDurationDays(contract.startDate, contract.endDate);
  const isActive = contract.status === ContractStatusEnum.ACTIVE;
  const isOverdue = contract.status === ContractStatusEnum.OVERDUE;
  const isDraft = contract.status === ContractStatusEnum.DRAFT;
  const isFromReservation = contract.source === ContractSourceEnum.RESERVATION;
  const isDepositSatisfied = isFromReservation || Boolean(contract.depositPaidAt);

  const displayUnitLabel =
    contract.storageUnit?.unitNumber ||
    unitNumber ||
    (contract.storageUnitId ? `Unit #${contract.storageUnitId.slice(-6).toUpperCase()}` : "—");

  const displayFacilityName =
    contract.facility?.name || facilityName || (isEn ? "StorageHub Facility" : "Cơ sở StorageHub");

  return (
    <Pressable
      onPress={() => onPress(contract)}
      className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm active:opacity-95 gap-3"
    >
      {/* Top Row: Contract Code + Status Badge */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20">
            <Boxes size={20} color="#0B927E" />
          </View>
          <View className="flex-1">
            <Text
              className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100"
              numberOfLines={1}
            >
              #{contract.contractCode}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Building2 size={11} color="#647B80" />
              <Text variant="muted" className="text-xs flex-1" numberOfLines={1}>
                {displayFacilityName} • #{displayUnitLabel}
              </Text>
            </View>
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

      {/* Telemetry Sensor Bar for Active Contracts */}
      {isActive ? (
        <View className="flex-row flex-wrap items-center gap-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 px-3 py-2.5">
          <View className="flex-row items-center gap-1">
            <Thermometer size={13} color="#0B927E" />
            <Text className="text-xs text-neutral-dark dark:text-neutral-300">24°C</Text>
          </View>
          <Text className="text-xs text-neutral-300 dark:text-neutral-700">•</Text>
          <View className="flex-row items-center gap-1">
            <Droplets size={13} color="#0B927E" />
            <Text className="text-xs text-neutral-dark dark:text-neutral-300">52%</Text>
          </View>
          <Text className="text-xs text-neutral-300 dark:text-neutral-700">•</Text>
          <View className="flex-row items-center gap-1">
            <Video size={13} color="#0B927E" />
            <Text className="text-xs text-neutral-dark dark:text-neutral-300">
              {isEn ? "24/7 CCTV Active" : "Camera 24/7"}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Lease Schedule & Financial Summary */}
      <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 p-3 gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Calendar size={13} color="#0B927E" />
            <Text variant="muted" className="text-xs">
              {formatDateShort(contract.startDate)} → {formatDateShort(contract.endDate)}
            </Text>
          </View>
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
            {durationDays} {isEn ? "days" : "ngày"}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color={isOverdue ? "#EF4444" : "#647B80"} />
            <Text
              className={`text-xs font-semibold ${
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {isActive
                ? remainingDays >= 0
                  ? isEn
                    ? `${remainingDays} days remaining`
                    : `Còn ${remainingDays} ngày thuê`
                  : isEn
                    ? "Lease period ended"
                    : "Đã đến hạn trả kho"
                : isOverdue
                  ? isEn
                    ? `Overdue (${Math.max(1, Math.abs(remainingDays))} days)`
                    : `Quá hạn ${Math.max(1, Math.abs(remainingDays))} ngày`
                  : getContractSourceLabel(contract.source, locale)}
            </Text>
          </View>

          {contract.amenities?.length > 0 ? (
            <View className="flex-row items-center gap-1">
              <Sparkles size={12} color="#0B927E" />
              <Text className="text-[11px] font-bold text-brand">
                +{contract.amenities.length} {isEn ? "amenities" : "tiện ích"}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2 mt-0.5">
          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
            {isDepositSatisfied ? (
              <>
                <CheckCircle2 size={13} color="#0B927E" />
                <Text className="text-[11px] font-bold text-brand flex-1" numberOfLines={1}>
                  {isFromReservation
                    ? isEn
                      ? "Deposit: Paid (From Reservation)"
                      : "Cọc: Đã thanh toán (kế thừa từ Đặt chỗ)"
                    : isEn
                      ? "Deposit Paid:"
                      : "Đã đóng cọc:"}{" "}
                  ({formatVnd(contract.depositAmount)})
                </Text>
              </>
            ) : (
              <Text className="text-[11px] font-bold text-cta">
                {isEn ? "Deposit Required:" : "Chưa đóng cọc:"} {formatVnd(contract.depositAmount)}
              </Text>
            )}
          </View>

          <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
            {isEn ? "Price:" : "Giá thuê:"}{" "}
            <Text className="text-xs font-extrabold text-brand">
              {formatVnd(contract.totalPeriodicPrice)} /{" "}
              {getRentalUnitLabel(contract.billingUnit, locale)}
            </Text>
          </Text>
        </View>
      </View>

      {/* Draft Notice */}
      {isDraft ? (
        <View className="rounded-xl border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 gap-1">
          <Text className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
            {!isDepositSatisfied
              ? isEn
                ? "Action Required: Pay security deposit & sign contract."
                : "Cần thực hiện: Thanh toán tiền đặt cọc & ký xác nhận hợp đồng."
              : !contract.customerSigned
                ? isEn
                  ? "Ready to Sign: Tap to review & sign your lease contract."
                  : "Đã đủ điều kiện: Nhấn vào để ký xác nhận hợp đồng thuê kho."
                : isEn
                  ? "You have signed! Waiting for facility staff handover signature."
                  : "Bạn đã ký hợp đồng! Đang chờ nhân viên cơ sở ký bàn giao kho."}
          </Text>
        </View>
      ) : null}

      {/* Smart Lock & PIN Controls for Active Contracts */}
      {isActive && (onUnlockPress || onViewPinPress) ? (
        <View className="flex-row items-center gap-2 pt-0.5">
          {/* {onUnlockPress ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onUnlockPress(contract);
              }}
              disabled={isUnlocking}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 shadow-sm active:opacity-90"
            >
              {isUnlocking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Lock size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">
                    {isEn ? "Unlock Unit" : "Mở khóa kho"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null} */}

          {onViewPinPress ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onViewPinPress(contract);
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5"
            >
              <KeyRound size={14} color="#647B80" />
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {isEn ? "PIN" : "Mã PIN"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* View Detail Footer Link */}
      <View className="flex-row items-center justify-end gap-1 pt-0.5">
        <Text className="text-xs font-bold text-brand">
          {isEn ? "View Contract Details" : "Xem chi tiết hợp đồng"}
        </Text>
        <ChevronRight size={14} color="#0B927E" />
      </View>
    </Pressable>
  );
}
