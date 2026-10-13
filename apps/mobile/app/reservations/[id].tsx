import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  ContractStatusEnum,
  ReservationStatusEnum,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Boxes,
  Calendar,
  ChevronRight,
  Clock,
  Sparkles,
  Receipt,
  Edit3,
  QrCode,
  RefreshCw,
  UserCheck,
  XCircle,
  AlertCircle,
  FileText,
  Layers,
  CheckCircle2,
} from "lucide-react-native";
import { useCustomerContractsByReservationMap } from "@/features/contracts/hooks/useContracts";
import { getContractStatusMeta } from "@/features/contracts/utils/contractFormat";
import {
  useReservationDetail,
  useRetryReservationPayment,
} from "@/features/reservations/hooks/useReservations";
import { ReservationTimelineStepper } from "@/features/reservations/components/ReservationTimelineStepper";
import { EditReservationModal } from "@/features/reservations/components/EditReservationModal";
import { CancelReservationModal } from "@/features/reservations/components/CancelReservationModal";
import {
  canCancelReservation,
  formatDateShort,
  formatDateTime,
  formatRentalDurationDays,
  formatVnd,
  getBillingUnitName,
  getCountdownRemaining,
  getReservationStatusMeta,
  getStorageUnitStatusLabel,
  resolveReservationErrorMessage,
} from "@/features/reservations/utils/reservationFormat";

export default function ReservationDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";

  const params = useLocalSearchParams<{ id?: string; reservationId?: string }>();
  const reservationId = params.id || params.reservationId;

  const {
    data: reservation,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useReservationDetail(reservationId);

  const { contractByReservationId, refetch: refetchContractsMap } =
    useCustomerContractsByReservationMap(Boolean(reservationId));

  const linkedContract = reservationId
    ? (contractByReservationId.get(reservationId) ?? null)
    : null;

  const retryPaymentMutation = useRetryReservationPayment(reservationId ?? "");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // Refetch whenever user returns to this screen (e.g. from ReservationPaymentScreen)
  useFocusEffect(
    useCallback(() => {
      if (reservationId) {
        void refetch();
        void refetchContractsMap();
      }
    }, [reservationId, refetch, refetchContractsMap])
  );

  const reservationStatus = reservation?.status;
  const reservationExpiresAt = reservation?.expiresAt;
  const hasRefetchedOnExpiryRef = React.useRef<string | null>(null);

  // Live countdown timer for `expiresAt` when status is PENDING_PAYMENT or PAYMENT_FAILED
  const [nowMs, setNowMs] = useState(() => Date.now());

  const shouldTickCountdown =
    (reservationStatus === ReservationStatusEnum.PENDING_PAYMENT ||
      reservationStatus === ReservationStatusEnum.PAYMENT_FAILED) &&
    Boolean(reservationExpiresAt);

  const countdown = shouldTickCountdown
    ? getCountdownRemaining(reservationExpiresAt, nowMs)
    : { isExpired: false, totalSeconds: 0, formatted: "" };

  useEffect(() => {
    if (!shouldTickCountdown || !reservationExpiresAt) {
      return;
    }

    const checkAndHandleExpiry = (currentNow: number) => {
      const next = getCountdownRemaining(reservationExpiresAt, currentNow);
      if (next.isExpired && hasRefetchedOnExpiryRef.current !== reservationExpiresAt) {
        hasRefetchedOnExpiryRef.current = reservationExpiresAt;
        void refetch();
      }
      return next.isExpired;
    };

    if (checkAndHandleExpiry(Date.now())) {
      return;
    }

    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      if (checkAndHandleExpiry(currentNow)) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldTickCountdown, reservationExpiresAt, refetch]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/reservations" as any);
    }
  };

  const handleNavigateToPayment = () => {
    if (!reservation) return;
    router.push({
      pathname: "/reservations/[id]/payment" as any,
      params: { id: reservation.id },
    });
  };

  const handleRetryPayment = async () => {
    if (!reservation) return;
    try {
      await retryPaymentMutation.mutateAsync();
      toast.success(
        isEn
          ? "Payment session reopened! Redirecting to VietQR..."
          : "Đã mở lại phiên thanh toán! Đang chuyển đến màn hình VietQR..."
      );
      router.push({
        pathname: "/reservations/[id]/payment" as any,
        params: { id: reservation.id },
      });
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "reservation");
      toast.error(resolved.message);
      refetch();
    }
  };

  const reservationAmenities = reservation?.amenities;
  const amenitiesTotal = useMemo(() => {
    if (!reservationAmenities) return 0;
    return reservationAmenities.reduce(
      (sum, item) => sum + (item.totalPrice ?? item.pricePerUnit * item.quantity),
      0
    );
  }, [reservationAmenities]);

  if (isLoading) {
    return (
      <SafeAreaView
        key="reservation-detail-loading"
        className="flex-1 bg-neutral-bg dark:bg-neutral-950"
      >
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
          <Pressable onPress={handleBack} hitSlop={10} className="p-1">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <Skeleton className="h-6 w-48 rounded-lg" />
        </View>
        <View className="p-4 gap-4">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !reservation) {
    const resolvedErr = resolveReservationErrorMessage(error, currentLocale, "reservation");
    return (
      <SafeAreaView
        key="reservation-detail-error"
        className="flex-1 bg-neutral-bg dark:bg-neutral-950"
      >
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
          <Pressable onPress={handleBack} hitSlop={10} className="p-1">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
            {isEn ? "Reservation Detail" : "Chi tiết đơn đặt chỗ"}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="mt-3 text-base font-bold text-neutral-dark dark:text-neutral-100 text-center">
            {resolvedErr.message}
          </Text>
          <Pressable onPress={() => refetch()} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{isEn ? "Try Again" : "Thử lại"}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = getReservationStatusMeta(reservation.status, currentLocale);
  const contractStatusMeta = linkedContract
    ? getContractStatusMeta(linkedContract.status, currentLocale)
    : null;
  const billingLabel = getBillingUnitName(reservation.billingUnit, currentLocale);

  const canEdit = reservation.status === ReservationStatusEnum.PENDING;
  const canPayDeposit = reservation.status === ReservationStatusEnum.PENDING_PAYMENT;
  const canRetryPayment = reservation.status === ReservationStatusEnum.PAYMENT_FAILED;
  const canCancel = canCancelReservation(reservation.status) && !linkedContract;

  const handleOpenLinkedContract = () => {
    if (!linkedContract) return;
    router.push({
      pathname: "/contracts/[id]" as any,
      params: { id: linkedContract.id },
    });
  };

  return (
    <SafeAreaView
      key="reservation-detail-loaded"
      className="flex-1 bg-neutral-bg dark:bg-neutral-950"
    >
      {/* Top Bar with Borderless ArrowLeft Back Button */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable onPress={handleBack} hitSlop={10} className="p-1 active:opacity-70">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <View className="flex-1">
            <Text
              className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100"
              numberOfLines={1}
            >
              #{reservation.reservationCode}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {isEn ? "Created:" : "Ngày tạo:"} {formatDateTime(reservation.createdAt)}
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

      <ScrollView
        contentContainerClassName="p-4 pb-28 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
              void refetchContractsMap();
            }}
            tintColor="#0B927E"
          />
        }
      >
        {/* ── Section 3.1: 6-Step Reservation Progress Timeline Stepper ── */}
        <ReservationTimelineStepper
          reservation={reservation}
          linkedContract={linkedContract}
          locale={currentLocale}
          countdownFormatted={countdown.formatted}
          isExpiredCountdown={countdown.isExpired}
          onPayDepositPress={canPayDeposit ? handleNavigateToPayment : undefined}
          onRetryPaymentPress={canRetryPayment ? handleRetryPayment : undefined}
          isRetryingPayment={retryPaymentMutation.isPending}
        />

        {/* ── Linked Contract Card (Visible from DRAFT through Check-in & Active Lease) ── */}
        {linkedContract && contractStatusMeta ? (
          <View className="rounded-3xl border border-brand/40 bg-brand-light/20 dark:bg-brand/15 p-4 shadow-sm gap-3">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2 flex-1">
                <FileText size={18} color="#0B927E" />
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
                    {isEn ? "Storage Lease Contract" : "Hợp đồng thuê kho đã khởi tạo"}
                  </Text>
                  <Text className="text-xs font-bold text-brand mt-0.5">
                    #{linkedContract.contractCode}
                  </Text>
                </View>
              </View>

              <Badge
                variant="outline"
                className={`${contractStatusMeta.badgeBorderClass} ${contractStatusMeta.badgeBgClass} px-2.5 py-1`}
              >
                <Text className={`text-[11px] font-bold ${contractStatusMeta.badgeTextClass}`}>
                  {contractStatusMeta.label}
                </Text>
              </Badge>
            </View>

            <View className="rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-border dark:border-neutral-800 p-3 gap-2">
              <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-4">
                {linkedContract.status === ContractStatusEnum.DRAFT
                  ? isEn
                    ? "Your lease contract is prepared in DRAFT state. Please visit the facility counter to check in and receive your storage unit."
                    : "Hợp đồng thuê kho đã được tạo ở trạng thái Bản nháp. Vui lòng đến quầy cơ sở gặp nhân viên phụ trách để làm thủ tục Check-in nhận kho."
                  : isEn
                    ? "Your storage lease contract is active. Tap below to view full contract details and smart lock controls."
                    : "Hợp đồng thuê kho của bạn đã kích hoạt. Nhấn bên dưới để xem chi tiết hợp đồng và điều khiển khóa thông minh."}
              </Text>

              {linkedContract.assignedStaff?.name ? (
                <View className="flex-row items-center gap-1.5 border-t border-neutral-200/70 dark:border-neutral-800 pt-2">
                  <UserCheck size={13} color="#0B927E" />
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Assigned Check-in Staff:" : "NV phụ trách Check-in:"}{" "}
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                      {linkedContract.assignedStaff.name}
                    </Text>
                  </Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={handleOpenLinkedContract}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-3 shadow-sm active:opacity-90"
            >
              <FileText size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                {linkedContract.status === ContractStatusEnum.DRAFT
                  ? isEn
                    ? "View Draft Contract & Check-in Info"
                    : "Xem chi tiết Hợp đồng chờ Check-in"
                  : isEn
                    ? "View Lease Contract Details"
                    : "Xem chi tiết Hợp đồng thuê kho"}
              </Text>
              <ChevronRight size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        {/* ── Section 3.2: Facility & Assigned Physical Storage Unit ── */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
          <View className="flex-row items-center gap-2">
            <Building2 size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "Facility & Assigned Storage Unit" : "Thông tin Cơ sở & Phòng kho"}
            </Text>
          </View>

          {/* Facility Details */}
          <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-2">
            <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
              {reservation.facility?.name || (isEn ? "Storage Facility" : "Cơ sở kho")}
            </Text>

            {reservation.facility?.address ? (
              <View className="flex-row items-start gap-2">
                <MapPin size={13} color="#647B80" />
                <Text variant="muted" className="text-xs flex-1">
                  {reservation.facility.address}
                  {reservation.facility.city ? `, ${reservation.facility.city}` : ""}
                </Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap items-center gap-4">
              {reservation.facility?.phone ? (
                <View className="flex-row items-center gap-1.5">
                  <Phone size={12} color="#0B927E" />
                  <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {reservation.facility.phone}
                  </Text>
                </View>
              ) : null}
              {reservation.facility?.email ? (
                <View className="flex-row items-center gap-1.5">
                  <Mail size={12} color="#0B927E" />
                  <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {reservation.facility.email}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Physical Storage Unit */}
          {reservation.storageUnit ? (
            <View
              key="assigned-storage-unit"
              className="rounded-2xl border border-brand/40 bg-brand-light/25 dark:bg-brand/15 p-3.5 gap-2"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Boxes size={16} color="#0B927E" />
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {isEn ? "Assigned Physical Unit" : "Phòng kho vật lý được gán"}
                  </Text>
                </View>
                <Badge
                  variant="outline"
                  className="border-brand bg-white dark:bg-neutral-900 px-2.5 py-0.5"
                >
                  <Text className="text-xs font-extrabold text-brand">
                    #{reservation.storageUnit.unitNumber}
                  </Text>
                </Badge>
              </View>

              <View className="flex-row flex-wrap items-center gap-4 pt-1">
                <View className="flex-row items-center gap-1.5">
                  <Layers size={13} color="#647B80" />
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Floor:" : "Tầng:"}{" "}
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {reservation.storageUnit.floor}
                    </Text>
                  </Text>
                </View>

                {reservation.storageUnit.zone ? (
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Zone:" : "Khu vực:"}{" "}
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {reservation.storageUnit.zone}
                    </Text>
                  </Text>
                ) : null}

                <Text variant="muted" className="text-xs">
                  {isEn ? "Unit Status:" : "Trạng thái kho:"}{" "}
                  <Text className="text-xs font-bold text-brand">
                    {getStorageUnitStatusLabel(reservation.storageUnit.status, currentLocale)}
                  </Text>
                </Text>
              </View>
            </View>
          ) : (
            <View
              key="unassigned-storage-unit"
              className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 p-3.5 flex-row items-center gap-2.5"
            >
              <Clock size={16} color="#647B80" />
              <Text variant="muted" className="text-xs flex-1 leading-4">
                {isEn
                  ? "Waiting for facility staff to inspect and assign a specific storage unit."
                  : "Đang chờ nhân viên cơ sở kiểm tra và gán phòng kho cụ thể."}
              </Text>
            </View>
          )}
        </View>

        {/* ── Section 3.3: Schedule, Amenities & Financial Breakdown ── */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3.5">
          <View className="flex-row items-center gap-2">
            <Receipt size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn
                ? "Schedule, Amenities & Cost Breakdown"
                : "Lịch thuê, Tiện ích & Chi tiết tài chính"}
            </Text>
          </View>

          {/* Rental Schedule */}
          <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Calendar size={13} color="#0B927E" />
                <Text variant="muted" className="text-xs">
                  {isEn ? "Expected Start Date:" : "Ngày bắt đầu thuê dự kiến:"}
                </Text>
              </View>
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {formatDateShort(reservation.startDate)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Clock size={13} color="#0B927E" />
                <Text variant="muted" className="text-xs">
                  {isEn ? "Rental Duration:" : "Thời hạn đăng ký:"}
                </Text>
              </View>
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {formatRentalDurationDays(reservation.rentalDuration, currentLocale)}
              </Text>
            </View>

            {reservation.notes ? (
              <View className="border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2 mt-0.5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <FileText size={12} color="#647B80" />
                  <Text variant="muted" className="text-[11px] font-semibold">
                    {isEn ? "Customer Notes:" : "Ghi chú của bạn:"}
                  </Text>
                </View>
                <Text className="text-xs text-neutral-700 dark:text-neutral-300">
                  {reservation.notes}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Selected Amenities List */}
          {reservation.amenities && reservation.amenities.length > 0 ? (
            <View className="gap-2">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={14} color="#0B927E" />
                <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {isEn ? "Registered Amenities" : "Tiện ích đi kèm đã đăng ký"}
                </Text>
              </View>

              {reservation.amenities.map((am) => (
                <View
                  key={am.facilityAmenityOfferingId}
                  className="flex-row items-center justify-between rounded-xl border border-neutral-border dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 px-3 py-2.5"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                      {am.name}
                    </Text>
                    <Text variant="muted" className="text-[11px]">
                      {am.quantity} × {formatVnd(am.pricePerUnit)} /{" "}
                      {getBillingUnitName(am.billingUnit, currentLocale)}
                    </Text>
                  </View>
                  <Text className="text-xs font-extrabold text-brand">
                    {formatVnd(am.totalPrice)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Financial Breakdown */}
          <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 p-3.5 gap-2">
            <View className="flex-row justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Base Storage Price:" : "Giá thuê kho cơ bản:"}
              </Text>
              <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                {formatVnd(reservation.basePrice)} / {billingLabel}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Deposit Amount Required:" : "Tiền đặt cọc cần thanh toán:"}
              </Text>
              <Text className="text-xs font-extrabold text-cta">
                {formatVnd(reservation.depositAmount)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Amenities Total:" : "Tổng phí tiện ích:"}
              </Text>
              <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                {formatVnd(amenitiesTotal)}
              </Text>
            </View>

            <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-0.5">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Total Reservation Value:" : "Tổng giá trị đơn:"}
              </Text>
              <Text className="text-sm font-extrabold text-brand">
                {formatVnd(reservation.totalAmount)}
              </Text>
            </View>

            {/* Paid Amount & Paid Timestamp if paid */}
            {reservation.paidAmount && reservation.paidAmount > 0 ? (
              <View className="mt-1 rounded-xl border border-brand/30 bg-brand-light/30 dark:bg-brand/15 p-2.5 gap-1">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={13} color="#0B927E" />
                    <Text className="text-xs font-bold text-brand">
                      {isEn ? "Deposit Paid:" : "Đã thanh toán cọc:"}
                    </Text>
                  </View>
                  <Text className="text-xs font-extrabold text-brand">
                    {formatVnd(reservation.paidAmount)}
                  </Text>
                </View>
                {reservation.paidAt ? (
                  <Text variant="muted" className="text-[10px]">
                    {isEn ? "Paid at:" : "Thời điểm thanh toán:"}{" "}
                    {formatDateTime(reservation.paidAt)}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Refund Amount if cancelled */}
            {reservation.status === ReservationStatusEnum.CANCELLED &&
            reservation.refundAmount > 0 ? (
              <View className="mt-1 flex-row items-center justify-between rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5">
                <Text className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {isEn ? "Refunded Amount:" : "Số tiền hoàn cọc:"}
                </Text>
                <Text className="text-xs font-extrabold text-brand">
                  {formatVnd(reservation.refundAmount)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* ── Section 3.4: Contextual Customer Actions Bottom Bar ── */}
      {(Boolean(linkedContract) || canEdit || canPayDeposit || canRetryPayment || canCancel) && (
        <View className="border-t border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 gap-2.5">
          {linkedContract ? (
            <Pressable
              onPress={handleOpenLinkedContract}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 shadow-sm active:opacity-90"
            >
              <FileText size={18} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">
                {linkedContract.status === ContractStatusEnum.DRAFT
                  ? isEn
                    ? `View Check-in Contract (#${linkedContract.contractCode})`
                    : `Xem hợp đồng (#${linkedContract.contractCode})`
                  : isEn
                    ? `View Lease Contract (#${linkedContract.contractCode})`
                    : `Xem Hợp đồng (#${linkedContract.contractCode})`}
              </Text>
            </Pressable>
          ) : null}

          {/* Primary Action: Pay Deposit or Retry Payment */}
          {canPayDeposit ? (
            <Pressable
              onPress={handleNavigateToPayment}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-cta py-3.5 shadow-sm active:opacity-90"
            >
              <QrCode size={18} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">
                {isEn
                  ? `Pay Deposit via VietQR (${formatVnd(reservation.depositAmount)})`
                  : `Thanh toán cọc ngay (${formatVnd(reservation.depositAmount)})`}
              </Text>
            </Pressable>
          ) : null}

          {canRetryPayment ? (
            <Pressable
              onPress={handleRetryPayment}
              disabled={retryPaymentMutation.isPending}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-cta py-3.5 shadow-sm active:opacity-90"
            >
              {retryPaymentMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={17} color="#FFFFFF" />
                  <Text className="text-sm font-bold text-white">
                    {isEn ? "Retry Deposit Payment" : "Thanh toán lại tiền cọc"}
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          {/* Secondary Actions Row: Edit (only when PENDING) & Cancel */}
          {(canEdit || canCancel) && (
            <View className="flex-row items-center gap-2.5">
              {canEdit ? (
                <Pressable
                  onPress={() => setEditModalVisible(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-brand bg-brand-light/30 dark:bg-brand/20 py-3 active:opacity-85"
                >
                  <Edit3 size={15} color="#0B927E" />
                  <Text className="text-xs font-bold text-brand">
                    {isEn ? "Edit Reservation" : "Chỉnh sửa đặt chỗ"}
                  </Text>
                </Pressable>
              ) : null}

              {canCancel ? (
                <Pressable
                  onPress={() => setCancelModalVisible(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 py-3 active:opacity-85"
                >
                  <XCircle size={15} color="#EF4444" />
                  <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                    {isEn ? "Cancel Reservation" : "Hủy đặt chỗ"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      )}

      {/* Modals */}
      <EditReservationModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        reservation={reservation}
        locale={currentLocale}
        onUpdated={() => refetch()}
      />

      <CancelReservationModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        reservation={reservation}
        locale={currentLocale}
        onCancelled={() => refetch()}
      />
    </SafeAreaView>
  );
}
