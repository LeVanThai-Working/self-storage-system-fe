import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useFacilityPublicDetail } from "@/features/storage-explore/hooks/useStorageExplore";
import { getPaymentByIdApi } from "@/features/reservations/api/payments.api";
import {
  ContractAddendumStatusEnum,
  ContractAddendumTypeEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  PaymentPurposeEnum,
  PaymentStatusEnum,
  type ContractAddendumResponse,
  type MessageLocale,
  type PaymentResponse,
  type PublicAmenityOfferingResponse,
} from "@self-storage-system-fe/shared";
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSignature,
  FileText,
  Layers,
  MapPin,
  Minus,
  MinusCircle,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  XCircle,
} from "lucide-react-native";
import {
  useCancelContractAddendum,
  useContractDetail,
  useCreateContractAddendum,
  useCreateContractPayment,
  useCustomerSignContract,
  useCustomerSignContractAddendum,
} from "@/features/contracts/hooks/useContracts";
import {
  formatDateShort,
  formatDateTime,
  formatVnd,
  getContractAddendumStatusMeta,
  getContractAddendumTypeMeta,
  getContractDurationDays,
  getContractSourceLabel,
  getContractStatusMeta,
  getMaxRemovableAmenityQty,
  getPendingRemoveAmenityQty,
  getRemainingDays,
  getRentalUnitLabel,
  resolveReservationErrorMessage,
} from "@/features/contracts/utils/contractFormat";

export default function ContractDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";

  const params = useLocalSearchParams<{ id?: string }>();
  const contractId = params.id ?? "";

  const {
    data: contract,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useContractDetail(contractId);

  const [mountNowMs] = useState(() => Date.now());

  // Contract signing state (Step 1 DRAFT)
  const [contractTermsAccepted, setContractTermsAccepted] = useState(true);
  const [contractSignNotes, setContractSignNotes] = useState("");

  // Payment QR Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentResponse | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Create Addendum Modal state (ADD / REMOVE)
  const [addendumModalType, setAddendumModalType] = useState<ContractAddendumTypeEnum | null>(null);
  const [addendumQuantities, setAddendumQuantities] = useState<Record<string, number>>({});
  const [addendumNotes, setAddendumNotes] = useState("");

  // Sign Addendum Modal state
  const [signAddendumTarget, setSignAddendumTarget] = useState<ContractAddendumResponse | null>(
    null
  );
  const [addendumTermsAccepted, setAddendumTermsAccepted] = useState(true);
  const [addendumSignNotes, setAddendumSignNotes] = useState("");

  // Cancel Addendum Modal state
  const [cancelAddendumTarget, setCancelAddendumTarget] = useState<ContractAddendumResponse | null>(
    null
  );
  const [cancelAddendumReason, setCancelAddendumReason] = useState("");

  // Mutations
  const signContractMutation = useCustomerSignContract(contractId);
  const createAddendumMutation = useCreateContractAddendum(contractId);
  const signAddendumMutation = useCustomerSignContractAddendum(contractId);
  const cancelAddendumMutation = useCancelContractAddendum(contractId);
  const createPaymentMutation = useCreateContractPayment(contractId);

  // Facility public detail for available amenities when creating ADD addendum
  const { data: facilityDetail, isLoading: isLoadingFacilityAmenities } = useFacilityPublicDetail(
    addendumModalType === ContractAddendumTypeEnum.ADD ? contract?.facilityId : undefined
  );

  const availableFacilityAmenities = useMemo<PublicAmenityOfferingResponse[]>(() => {
    return (facilityDetail?.amenityOfferings ?? []).filter((a) => (a.availableQuantity ?? 0) > 0);
  }, [facilityDetail?.amenityOfferings]);

  useFocusEffect(
    useCallback(() => {
      if (contractId) {
        void refetch();
      }
    }, [contractId, refetch])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/my-storages" as any);
    }
  };

  const handleOpenPaymentQr = async (
    purpose: PaymentPurposeEnum = PaymentPurposeEnum.CONTRACT_DEPOSIT
  ) => {
    try {
      const payment = await createPaymentMutation.mutateAsync(purpose);
      setActivePayment(payment);
      setPaymentModalOpen(true);
      if (payment.status === PaymentStatusEnum.PAID) {
        await refetch();
      }
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "payment");
      toast.error(resolved.message);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!activePayment?.id) return;
    setIsCheckingPayment(true);
    try {
      const latest = await getPaymentByIdApi(activePayment.id);
      setActivePayment(latest);
      if (latest.status === PaymentStatusEnum.PAID) {
        toast.success(
          isEn
            ? "Payment confirmed! Updating contract..."
            : "Đã xác nhận thanh toán thành công! Đang cập nhật hợp đồng..."
        );
        await refetch();
        setPaymentModalOpen(false);
      } else {
        toast.info(
          isEn
            ? "Waiting for bank transfer confirmation..."
            : "Hệ thống đang chờ nhận giao dịch chuyển khoản..."
        );
      }
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "payment");
      toast.error(resolved.message);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleCustomerSignContract = async () => {
    if (!contractTermsAccepted) {
      toast.error(
        isEn
          ? "Please accept the contract terms before signing."
          : "Vui lòng đồng ý với các điều khoản hợp đồng trước khi ký xác nhận."
      );
      return;
    }

    try {
      const updated = await signContractMutation.mutateAsync({
        termsAccepted: true,
        notes: contractSignNotes.trim() || undefined,
      });
      toast.success(
        updated.status === ContractStatusEnum.ACTIVE
          ? isEn
            ? "Contract signed and activated! Your storage unit is ready."
            : "Đã ký xác nhận! Cả 2 bên đã hoàn tất ký, hợp đồng đã kích hoạt sang Đang thuê (ACTIVE)."
          : isEn
            ? "Contract signed! Waiting for facility staff handover signature."
            : "Bạn đã ký xác nhận hợp đồng! Hợp đồng sẽ kích hoạt ngay khi nhân viên cơ sở ký bàn giao kho."
      );
      setContractSignNotes("");
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "contract");
      toast.error(resolved.message);
    }
  };

  const openAddendumModal = (type: ContractAddendumTypeEnum) => {
    setAddendumModalType(type);
    setAddendumQuantities({});
    setAddendumNotes("");
  };

  const adjustAddendumQty = (offeringId: string, delta: number, maxQty: number) => {
    setAddendumQuantities((prev) => {
      const current = prev[offeringId] ?? 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      if (next <= 0) {
        const clone = { ...prev };
        delete clone[offeringId];
        return clone;
      }
      return { ...prev, [offeringId]: next };
    });
  };

  const selectedAddendumItems = useMemo(() => {
    return Object.entries(addendumQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([facilityAmenityOfferingId, quantity]) => ({
        facilityAmenityOfferingId,
        quantity,
      }));
  }, [addendumQuantities]);

  const addendumPreviewPeriodicDelta = useMemo(() => {
    if (!contract) return 0;
    let sum = 0;
    for (const item of selectedAddendumItems) {
      if (addendumModalType === ContractAddendumTypeEnum.ADD) {
        const found = availableFacilityAmenities.find(
          (a) => a.id === item.facilityAmenityOfferingId
        );
        sum += (found?.pricePerUnit ?? 0) * item.quantity;
      } else {
        const found = (contract.amenities ?? []).find(
          (a) => a.facilityAmenityOfferingId === item.facilityAmenityOfferingId
        );
        sum += (found?.pricePerUnit ?? 0) * item.quantity;
      }
    }
    return sum;
  }, [selectedAddendumItems, addendumModalType, availableFacilityAmenities, contract]);

  const handleSubmitCreateAddendum = async () => {
    if (!addendumModalType) return;
    if (selectedAddendumItems.length === 0) {
      toast.error(
        isEn
          ? "Please select at least 1 amenity item."
          : "Vui lòng chọn ít nhất 1 tiện ích với số lượng > 0."
      );
      return;
    }

    try {
      await createAddendumMutation.mutateAsync({
        type: addendumModalType,
        amenities: selectedAddendumItems,
        notes: addendumNotes.trim() || undefined,
      });
      toast.success(
        addendumModalType === ContractAddendumTypeEnum.ADD
          ? isEn
            ? "Add-amenity addendum submitted for approval!"
            : "Đã gửi yêu cầu Phụ lục Thuê thêm tiện ích! Vui lòng chờ cơ sở duyệt."
          : isEn
            ? "Remove-amenity addendum submitted for approval!"
            : "Đã gửi yêu cầu Phụ lục Tháo dỡ / Trả bớt tiện ích! Vui lòng chờ cơ sở duyệt."
      );
      setAddendumModalType(null);
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "contract addendum");
      toast.error(resolved.message);
    }
  };

  const handleCustomerSignAddendum = async () => {
    if (!signAddendumTarget) return;
    if (!addendumTermsAccepted) {
      toast.error(
        isEn
          ? "Please accept the addendum terms before signing."
          : "Vui lòng đồng ý điều khoản phụ lục trước khi ký xác nhận."
      );
      return;
    }

    try {
      await signAddendumMutation.mutateAsync({
        addendumId: signAddendumTarget.id,
        payload: {
          termsAccepted: true,
          notes: addendumSignNotes.trim() || undefined,
        },
      });
      toast.success(
        isEn ? "Addendum signed successfully!" : "Đã ký xác nhận phụ lục hợp đồng thành công!"
      );
      setSignAddendumTarget(null);
      setAddendumSignNotes("");
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "contract addendum");
      toast.error(resolved.message);
    }
  };

  const handleCancelAddendum = async () => {
    if (!cancelAddendumTarget) return;
    const trimmed = cancelAddendumReason.trim();
    if (!trimmed) {
      toast.error(
        isEn ? "Please enter a cancellation reason." : "Vui lòng nhập lý do hủy phụ lục."
      );
      return;
    }

    try {
      await cancelAddendumMutation.mutateAsync({
        addendumId: cancelAddendumTarget.id,
        payload: { cancellationReason: trimmed },
      });
      toast.success(isEn ? "Contract addendum cancelled." : "Đã hủy yêu cầu phụ lục hợp đồng.");
      setCancelAddendumTarget(null);
      setCancelAddendumReason("");
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "contract addendum");
      toast.error(resolved.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
          <Pressable onPress={handleBack} hitSlop={10} className="p-1">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <Skeleton className="h-6 w-48 rounded-lg" />
        </View>
        <View className="p-4 gap-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !contract) {
    const resolvedErr = resolveReservationErrorMessage(error, currentLocale, "contract");
    return (
      <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
          <Pressable onPress={handleBack} hitSlop={10} className="p-1">
            <ArrowLeft size={22} color="#0F172A" />
          </Pressable>
          <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
            {isEn ? "Contract Details" : "Chi tiết hợp đồng thuê kho"}
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

  const statusMeta = getContractStatusMeta(contract.status, currentLocale);
  const billingLabel = getRentalUnitLabel(contract.billingUnit, currentLocale);
  const remainingDays = getRemainingDays(contract.endDate, mountNowMs);
  const durationDays = getContractDurationDays(contract.startDate, contract.endDate);

  const isDraft = contract.status === ContractStatusEnum.DRAFT;
  const isActive = contract.status === ContractStatusEnum.ACTIVE;
  const isFromReservation = contract.source === ContractSourceEnum.RESERVATION;
  const isDepositSatisfied = isFromReservation || Boolean(contract.depositPaidAt);
  const canCustomerSignContract = isDraft && isDepositSatisfied && !contract.customerSigned;

  const isCompletedOrSettled =
    contract.status === ContractStatusEnum.COMPLETED ||
    contract.status === ContractStatusEnum.OVERDUE ||
    contract.status === ContractStatusEnum.TERMINATED ||
    contract.damageFee > 0 ||
    contract.overdueFee > 0 ||
    contract.refundAmount > 0 ||
    contract.additionalPaymentRequired > 0;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Bar */}
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
              #{contract.contractCode}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {getContractSourceLabel(contract.source, currentLocale)} •{" "}
              {formatDateTime(contract.createdAt)}
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
        contentContainerClassName="p-4 pb-16 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0B927E" />
        }
      >
        {/* 1. Status & Lifecycle Overview Card */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              {isEn ? "Contract Status" : "Trạng thái hợp đồng"}
            </Text>
            {contract.termsAccepted ? (
              <View className="flex-row items-center gap-1">
                <CheckCircle2 size={13} color="#0B927E" />
                <Text className="text-[11px] font-bold text-brand">
                  {isEn ? "Both Parties Signed" : "Đã hoàn tất ký 2 bên"}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="text-xs text-neutral-700 dark:text-neutral-300 leading-5">
            {statusMeta.description}
          </Text>

          {contract.cancellationReason ? (
            <View className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mt-1">
              <Text className="text-xs font-bold text-red-700 dark:text-red-300">
                {isEn ? "Cancellation Reason:" : "Lý do hủy hợp đồng:"}{" "}
                {contract.cancellationReason}
              </Text>
            </View>
          ) : null}

          {contract.terminationReason ? (
            <View className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mt-1">
              <Text className="text-xs font-bold text-red-700 dark:text-red-300">
                {isEn ? "Early Termination Reason:" : "Lý do chấm dứt trước hạn:"}{" "}
                {contract.terminationReason}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 1B. DRAFT Contract Action Card: Deposit & Dual-Party Signing */}
        {isDraft ? (
          <View className="rounded-3xl border border-brand/40 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3.5">
            <View className="flex-row items-center gap-2">
              <FileSignature size={18} color="#0B927E" />
              <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100 flex-1">
                {isEn
                  ? "Deposit & Dual-Party Contract Signing"
                  : "Tiền cọc & Ký Xác nhận Hợp đồng (2 chiều)"}
              </Text>
            </View>

            {/* Step 1: Deposit Status (Inherited from Reservation if source === 'reservation') */}
            <View
              className={`rounded-2xl border p-3 gap-1 ${
                isDepositSatisfied
                  ? "border-brand/40 bg-brand-light/25 dark:bg-brand/15"
                  : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 flex-1">
                  {isDepositSatisfied ? (
                    <CheckCircle2 size={14} color="#0B927E" />
                  ) : (
                    <Clock size={14} color="#D97706" />
                  )}
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {isEn ? "1. Security Deposit" : "1. Tiền đặt cọc hợp đồng"}
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-brand">
                  {formatVnd(contract.depositAmount)}
                </Text>
              </View>

              <Text variant="muted" className="text-[11px]">
                {isFromReservation
                  ? `${isEn ? "Paid (Inherited from Reservation)" : "Đã thanh toán (kế thừa từ Đặt chỗ)"}${
                      contract.depositPaidAt ? ` • ${formatDateTime(contract.depositPaidAt)}` : ""
                    }`
                  : contract.depositPaidAt
                    ? `${isEn ? "Paid at:" : "Đã thanh toán lúc:"} ${formatDateTime(contract.depositPaidAt)}`
                    : isEn
                      ? "Unpaid (Walk-in contract deposit)"
                      : "Chưa thanh toán tiền cọc hợp đồng"}
              </Text>

              {/* NEVER show deposit payment button if source === 'reservation' or depositPaidAt is present */}
              {!isDepositSatisfied && contract.source === ContractSourceEnum.WALK_IN ? (
                <Pressable
                  onPress={() => handleOpenPaymentQr(PaymentPurposeEnum.CONTRACT_DEPOSIT)}
                  disabled={createPaymentMutation.isPending}
                  className="mt-2 flex-row items-center justify-center gap-2 rounded-xl bg-cta py-2.5 px-4 active:opacity-90"
                >
                  {createPaymentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <QrCode size={15} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        {isEn ? "Pay Security Deposit (VietQR)" : "Thanh toán Tiền đặt cọc (QR)"}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>

            {/* Step 2: Dual-Party Signature Progress */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {isEn ? "2. Dual-Party Signature Progress" : "2. Tiến độ Ký Xác nhận 2 bên"}
              </Text>

              <View className="flex-row gap-2.5">
                {/* Customer Signature Box */}
                <View
                  className={`flex-1 rounded-2xl border p-3 gap-1 ${
                    contract.customerSigned
                      ? "border-brand/40 bg-brand-light/25 dark:bg-brand/15"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-extrabold text-neutral-dark dark:text-neutral-100">
                      {isEn ? "Customer (You)" : "Khách hàng (Bạn)"}
                    </Text>
                    {contract.customerSigned ? (
                      <CheckCircle2 size={14} color="#0B927E" />
                    ) : (
                      <Clock size={14} color="#D97706" />
                    )}
                  </View>
                  <Text
                    className={`text-xs font-bold ${
                      contract.customerSigned
                        ? "text-brand"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {contract.customerSigned
                      ? isEn
                        ? "Signed"
                        : "Đã ký xác nhận"
                      : isEn
                        ? "Pending signature"
                        : "Chưa ký"}
                  </Text>
                  {contract.customerSignedAt ? (
                    <Text variant="muted" className="text-[10px]">
                      {formatDateTime(contract.customerSignedAt)}
                    </Text>
                  ) : null}
                </View>

                {/* Staff Signature Box */}
                <View
                  className={`flex-1 rounded-2xl border p-3 gap-1 ${
                    contract.staffSigned
                      ? "border-brand/40 bg-brand-light/25 dark:bg-brand/15"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-extrabold text-neutral-dark dark:text-neutral-100">
                      {isEn ? "Facility Staff" : "Nhân viên cơ sở"}
                    </Text>
                    {contract.staffSigned ? (
                      <CheckCircle2 size={14} color="#0B927E" />
                    ) : (
                      <Clock size={14} color="#D97706" />
                    )}
                  </View>
                  <Text
                    className={`text-xs font-bold ${
                      contract.staffSigned ? "text-brand" : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    {contract.staffSigned
                      ? isEn
                        ? "Signed Handover"
                        : "Đã ký bàn giao"
                      : isEn
                        ? "Pending handover"
                        : "Chờ ký bàn giao"}
                  </Text>
                  {contract.staffSignedAt ? (
                    <Text variant="muted" className="text-[10px]">
                      {formatDateTime(contract.staffSignedAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Customer Sign Form when deposit & first-cycle are satisfied and !customerSigned */}
            {canCustomerSignContract ? (
              <View className="rounded-2xl border border-brand/40 bg-brand-light/15 dark:bg-brand/10 p-3.5 gap-3">
                <Pressable
                  onPress={() => setContractTermsAccepted((prev) => !prev)}
                  className="flex-row items-start gap-2.5"
                >
                  <View
                    className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
                      contractTermsAccepted
                        ? "border-brand bg-brand"
                        : "border-neutral-400 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    {contractTermsAccepted ? <Check size={13} color="#FFFFFF" /> : null}
                  </View>
                  <Text className="flex-1 text-xs font-semibold text-neutral-dark dark:text-neutral-200 leading-4">
                    {isEn
                      ? "I have reviewed the storage unit condition, rental fee, and agree to all terms & conditions of this lease contract."
                      : "Tôi đã kiểm tra thông tin ô kho, chi phí thuê và đồng ý với toàn bộ điều khoản của hợp đồng thuê kho này."}
                  </Text>
                </Pressable>

                <TextInput
                  value={contractSignNotes}
                  onChangeText={setContractSignNotes}
                  placeholder={
                    isEn
                      ? "Optional notes when signing..."
                      : "Ghi chú thêm khi ký hợp đồng (không bắt buộc)..."
                  }
                  placeholderTextColor="#94A3B8"
                  className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-dark dark:text-neutral-100"
                />

                <Pressable
                  onPress={handleCustomerSignContract}
                  disabled={!contractTermsAccepted || signContractMutation.isPending}
                  className={`flex-row items-center justify-center gap-2 rounded-xl py-3 px-4 ${
                    !contractTermsAccepted || signContractMutation.isPending
                      ? "bg-neutral-300 dark:bg-neutral-700"
                      : "bg-brand active:opacity-90"
                  }`}
                >
                  {signContractMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <FileSignature size={16} color="#FFFFFF" />
                      <Text className="text-xs font-extrabold text-white">
                        {isEn ? "Sign & Confirm Contract" : "Ký xác nhận hợp đồng"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : contract.customerSigned && !contract.staffSigned ? (
              <View className="rounded-2xl border border-brand/30 bg-brand-light/20 p-3 flex-row items-center gap-2.5">
                <CheckCircle2 size={16} color="#0B927E" />
                <Text className="flex-1 text-xs font-semibold text-brand leading-4">
                  {isEn
                    ? "You have signed this contract! Once facility staff signs the handover, your contract will automatically become ACTIVE."
                    : "Bạn đã ký xác nhận hợp đồng! Ngay khi nhân viên cơ sở ký xác nhận bàn giao kho, hợp đồng sẽ tự động chuyển sang Đang thuê (ACTIVE)."}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 2. Facility & Physical Storage Unit */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
          <View className="flex-row items-center gap-2">
            <Building2 size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "Storage Unit & Facility" : "Thông tin Kho lưu trữ & Cơ sở"}
            </Text>
          </View>

          {contract.facility ? (
            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-1.5">
              <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                {contract.facility.name}
              </Text>
              {contract.facility.address ? (
                <View className="flex-row items-start gap-1.5">
                  <MapPin size={13} color="#647B80" />
                  <Text variant="muted" className="text-xs flex-1">
                    {contract.facility.address}
                    {contract.facility.city ? `, ${contract.facility.city}` : ""}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="rounded-2xl border border-brand/40 bg-brand-light/25 dark:bg-brand/15 p-3.5 gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Boxes size={16} color="#0B927E" />
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {isEn ? "Assigned Storage Unit" : "Ô kho vật lý"}
                </Text>
              </View>
              <Badge
                variant="outline"
                className="border-brand bg-white dark:bg-neutral-900 px-2.5 py-0.5"
              >
                <Text className="text-xs font-extrabold text-brand">
                  #
                  {contract.storageUnit?.unitNumber ||
                    contract.storageUnitId.slice(-6).toUpperCase()}
                </Text>
              </Badge>
            </View>

            {contract.storageUnit ? (
              <View className="flex-row flex-wrap items-center gap-4 pt-1">
                <View className="flex-row items-center gap-1.5">
                  <Layers size={13} color="#647B80" />
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Floor:" : "Tầng:"}{" "}
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {contract.storageUnit.floor}
                    </Text>
                  </Text>
                </View>

                {contract.storageUnit.zone ? (
                  <Text variant="muted" className="text-xs">
                    {isEn ? "Zone:" : "Khu vực:"}{" "}
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {contract.storageUnit.zone}
                    </Text>
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {contract.assignedStaff ? (
            <View className="flex-row items-center justify-between rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 px-3.5 py-2.5">
              <View className="flex-row items-center gap-2">
                <UserCheck size={14} color="#0B927E" />
                <Text variant="muted" className="text-xs">
                  {isEn ? "Assigned Check-in Staff:" : "Nhân viên phụ trách:"}
                </Text>
              </View>
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {contract.assignedStaff.name}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3. Lease Period & Check-in / Check-out Timestamps */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
          <View className="flex-row items-center gap-2">
            <Calendar size={18} color="#0B927E" />
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {isEn ? "Lease Period & Handover" : "Thời hạn thuê & Bàn giao"}
            </Text>
          </View>

          <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Start Date:" : "Ngày bắt đầu thuê:"}
              </Text>
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {formatDateShort(contract.startDate)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "End Date:" : "Ngày hết hạn:"}
              </Text>
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {formatDateShort(contract.endDate)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Lease Duration:" : "Thời lượng thuê:"}
              </Text>
              <Text className="text-xs font-bold text-brand">
                {durationDays} {isEn ? "days" : "ngày"}
              </Text>
            </View>

            {isActive ? (
              <View className="flex-row items-center justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Remaining Time:" : "Thời gian còn lại:"}
                </Text>
                <Text className="text-xs font-extrabold text-brand">
                  {remainingDays >= 0
                    ? isEn
                      ? `${remainingDays} days`
                      : `${remainingDays} ngày`
                    : isEn
                      ? "Expired"
                      : "Đã hết hạn"}
                </Text>
              </View>
            ) : null}

            {contract.actualCheckInDate ? (
              <View className="flex-row items-center justify-between border-t border-neutral-200/70 dark:border-neutral-700/70 pt-2">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Actual Check-in:" : "Thời điểm Check-in nhận kho:"}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {formatDateTime(contract.actualCheckInDate)}
                </Text>
              </View>
            ) : null}

            {contract.actualCheckOutDate ? (
              <View className="flex-row items-center justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Actual Check-out:" : "Thời điểm Check-out trả kho:"}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {formatDateTime(contract.actualCheckOutDate)}
                </Text>
              </View>
            ) : null}
          </View>

          {contract.inspectionNotes ? (
            <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 p-3 gap-1">
              <View className="flex-row items-center gap-1.5">
                <ClipboardCheck size={13} color="#0B927E" />
                <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {isEn ? "Inspection Notes:" : "Biên bản kiểm tra kho:"}
                </Text>
              </View>
              <Text className="text-xs text-neutral-600 dark:text-neutral-300">
                {contract.inspectionNotes}
              </Text>
            </View>
          ) : null}

          {contract.notes ? (
            <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/50 p-3 gap-1">
              <View className="flex-row items-center gap-1.5">
                <FileText size={13} color="#647B80" />
                <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  {isEn ? "Contract Notes:" : "Ghi chú hợp đồng:"}
                </Text>
              </View>
              <Text className="text-xs text-neutral-600 dark:text-neutral-300">
                {contract.notes}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 4. Amenities & Financial Breakdown */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3.5">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 flex-1">
              <Receipt size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Amenities & Financial Summary" : "Tiện ích đi kèm & Chi phí thuê"}
              </Text>
            </View>
          </View>

          {/* Action Buttons to Request ADD or REMOVE Amenity Addendums when ACTIVE */}
          {isActive ? (
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => openAddendumModal(ContractAddendumTypeEnum.ADD)}
                className="flex-1 min-w-[140px] flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 px-3 active:opacity-90"
              >
                <Plus size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  {isEn ? "Add Amenities" : "Thuê thêm tiện ích"}
                </Text>
              </Pressable>

              {contract.amenities && contract.amenities.length > 0 ? (
                <Pressable
                  onPress={() => openAddendumModal(ContractAddendumTypeEnum.REMOVE)}
                  className="flex-1 min-w-[140px] flex-row items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 py-2.5 px-3 active:opacity-90"
                >
                  <MinusCircle size={14} color="#D97706" />
                  <Text className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {isEn ? "Remove / Return" : "Yêu cầu tháo dỡ / trả bớt"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Registered Active Amenities */}
          {contract.amenities && contract.amenities.length > 0 ? (
            <View className="gap-2">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={14} color="#0B927E" />
                <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  {isEn ? "Active Amenities" : "Danh sách tiện ích đang thuê"} (
                  {contract.amenities.length})
                </Text>
              </View>

              {contract.amenities.map((am) => (
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
                      {getRentalUnitLabel(am.billingUnit, currentLocale)}
                    </Text>
                  </View>
                  <Text className="text-xs font-extrabold text-brand">
                    {formatVnd(am.totalPrice)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 p-3.5 gap-2">
            <View className="flex-row justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Base Storage Rental:" : "Giá thuê kho cơ bản:"}
              </Text>
              <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                {formatVnd(contract.rentalPrice)} / {billingLabel}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text variant="muted" className="text-xs">
                {isEn ? "Amenities Total:" : "Tổng phí tiện ích:"}
              </Text>
              <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                {formatVnd(contract.amenitiesTotalPrice)}
              </Text>
            </View>

            <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-0.5">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Total Periodic Price:" : "Tổng giá thuê định kỳ:"}
              </Text>
              <Text className="text-sm font-extrabold text-brand">
                {formatVnd(contract.totalPeriodicPrice)} / {billingLabel}
              </Text>
            </View>

            {/* Security Deposit Box */}
            <View className="mt-1 rounded-xl border border-brand/30 bg-brand-light/30 dark:bg-brand/15 p-2.5 gap-1">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  {isDepositSatisfied ? (
                    <CheckCircle2 size={13} color="#0B927E" />
                  ) : (
                    <Clock size={13} color="#FF702E" />
                  )}
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {isEn ? "Security Deposit:" : "Tiền đặt cọc hợp đồng:"}
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-brand">
                  {formatVnd(contract.depositAmount)}
                </Text>
              </View>
              <Text variant="muted" className="text-[10px]">
                {isFromReservation
                  ? `${isEn ? "Paid (Inherited from Reservation)" : "Đã thanh toán (kế thừa từ Đặt chỗ)"}${
                      contract.depositPaidAt ? ` • ${formatDateTime(contract.depositPaidAt)}` : ""
                    }`
                  : contract.depositPaidAt
                    ? `${isEn ? "Paid at:" : "Đã thu cọc lúc:"} ${formatDateTime(
                        contract.depositPaidAt
                      )}`
                    : isEn
                      ? "Awaiting deposit payment"
                      : "Chưa đóng cọc"}
              </Text>
            </View>
          </View>
        </View>

        {/* 4B. Contract Addendums Section (contract.addendums) */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <FileSignature size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Contract Addendums" : "Danh sách Phụ lục Hợp đồng"} (
                {contract.addendums?.length ?? 0})
              </Text>
            </View>
          </View>

          {!contract.addendums || contract.addendums.length === 0 ? (
            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 p-4 items-center">
              <Text variant="muted" className="text-xs text-center">
                {isEn
                  ? "No contract addendums (amenity additions or removals) have been created."
                  : "Chưa có phụ lục hợp đồng (thuê thêm hoặc tháo dỡ tiện ích) nào."}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {contract.addendums.map((addendum) => {
                const typeMeta = getContractAddendumTypeMeta(addendum.type, currentLocale);
                const addStatusMeta = getContractAddendumStatusMeta(addendum.status, currentLocale);
                const isAddendumDraft = addendum.status === ContractAddendumStatusEnum.DRAFT;
                const isPendingApproval =
                  addendum.status === ContractAddendumStatusEnum.PENDING_APPROVAL;
                const canCustomerSignAddendum = isAddendumDraft && !addendum.customerSigned;
                const canCancelAddendum = isPendingApproval || isAddendumDraft;

                return (
                  <View
                    key={addendum.id}
                    className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/60 p-3.5 gap-2.5"
                  >
                    {/* Header: Code + Badges */}
                    <View className="flex-row flex-wrap items-center justify-between gap-2">
                      <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                        #{addendum.addendumCode}
                      </Text>
                      <View className="flex-row flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`${typeMeta.badgeBorderClass} ${typeMeta.badgeBgClass} px-2 py-0.5`}
                        >
                          <Text className={`text-[10px] font-bold ${typeMeta.badgeTextClass}`}>
                            {typeMeta.label}
                          </Text>
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${addStatusMeta.badgeBorderClass} ${addStatusMeta.badgeBgClass} px-2 py-0.5`}
                        >
                          <Text className={`text-[10px] font-bold ${addStatusMeta.badgeTextClass}`}>
                            {addStatusMeta.label}
                          </Text>
                        </Badge>
                      </View>
                    </View>

                    {/* Amenities inside Addendum */}
                    <View className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 p-2.5 gap-1.5">
                      {addendum.amenities.map((am) => (
                        <View
                          key={am.facilityAmenityOfferingId}
                          className="flex-row items-center justify-between"
                        >
                          <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200 flex-1 pr-2">
                            {am.name} × {am.quantity}
                          </Text>
                          <Text
                            className={`text-xs font-bold ${
                              typeMeta.isRemove
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-brand"
                            }`}
                          >
                            {typeMeta.isRemove ? "-" : "+"}
                            {formatVnd(am.totalPrice)} /{" "}
                            {getRentalUnitLabel(am.billingUnit, currentLocale)}
                          </Text>
                        </View>
                      ))}

                      <View className="flex-row items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-1.5 mt-0.5">
                        <Text variant="muted" className="text-[11px] font-bold">
                          {isEn ? "Periodic Adjustment:" : "Chênh lệch mỗi kỳ:"}
                        </Text>
                        <Text
                          className={`text-xs font-extrabold ${
                            typeMeta.isRemove ? "text-amber-700 dark:text-amber-300" : "text-brand"
                          }`}
                        >
                          {typeMeta.isRemove ? "-" : "+"}
                          {formatVnd(addendum.totalPeriodicPrice)} / {isEn ? "cycle" : "kỳ"}
                        </Text>
                      </View>

                      {typeMeta.isRemove && (addendum.damageFee ?? 0) > 0 ? (
                        <View className="flex-row items-center justify-between pt-1">
                          <Text className="text-[11px] font-bold text-red-600 dark:text-red-400">
                            {isEn ? "Removal Damage Fee:" : "Phí đền bù hư hại khi tháo dỡ:"}
                          </Text>
                          <Text className="text-xs font-extrabold text-red-600 dark:text-red-400">
                            {formatVnd(addendum.damageFee)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Dual Signature Status for DRAFT / ACTIVE Addendums */}
                    {isAddendumDraft || addendum.status === ContractAddendumStatusEnum.ACTIVE ? (
                      <View className="flex-row gap-2">
                        <View className="flex-1 rounded-xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 flex-row items-center justify-between">
                          <View>
                            <Text className="text-[10px] font-bold text-neutral-500">
                              {isEn ? "Customer" : "Khách hàng"}
                            </Text>
                            <Text className="text-[11px] font-bold text-neutral-dark dark:text-neutral-200">
                              {addendum.customerSigned
                                ? isEn
                                  ? "Signed"
                                  : "Đã ký"
                                : isEn
                                  ? "Unsigned"
                                  : "Chưa ký"}
                            </Text>
                          </View>
                          {addendum.customerSigned ? (
                            <CheckCircle2 size={14} color="#0B927E" />
                          ) : (
                            <Clock size={14} color="#D97706" />
                          )}
                        </View>

                        <View className="flex-1 rounded-xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 flex-row items-center justify-between">
                          <View>
                            <Text className="text-[10px] font-bold text-neutral-500">
                              {isEn ? "Staff" : "Nhân viên"}
                            </Text>
                            <Text className="text-[11px] font-bold text-neutral-dark dark:text-neutral-200">
                              {addendum.staffSigned
                                ? isEn
                                  ? "Signed"
                                  : "Đã ký"
                                : isEn
                                  ? "Unsigned"
                                  : "Chưa ký"}
                            </Text>
                          </View>
                          {addendum.staffSigned ? (
                            <CheckCircle2 size={14} color="#0B927E" />
                          ) : (
                            <Clock size={14} color="#D97706" />
                          )}
                        </View>
                      </View>
                    ) : null}

                    {addendum.rejectionReason ? (
                      <Text className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                        {isEn ? "Rejection Reason:" : "Lý do từ chối:"} {addendum.rejectionReason}
                      </Text>
                    ) : null}

                    {addendum.cancellationReason ? (
                      <Text variant="muted" className="text-[11px]">
                        {isEn ? "Cancellation Reason:" : "Lý do hủy:"} {addendum.cancellationReason}
                      </Text>
                    ) : null}

                    {/* Addendum Actions for Customer */}
                    {canCustomerSignAddendum || canCancelAddendum ? (
                      <View className="flex-row items-center justify-end gap-2 pt-1">
                        {canCancelAddendum ? (
                          <Pressable
                            onPress={() => {
                              setCancelAddendumTarget(addendum);
                              setCancelAddendumReason("");
                            }}
                            className="flex-row items-center gap-1 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 px-3 py-2 active:opacity-80"
                          >
                            <XCircle size={13} color="#EF4444" />
                            <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                              {isEn ? "Cancel" : "Hủy phụ lục"}
                            </Text>
                          </Pressable>
                        ) : null}

                        {canCustomerSignAddendum ? (
                          <Pressable
                            onPress={() => {
                              setSignAddendumTarget(addendum);
                              setAddendumTermsAccepted(true);
                              setAddendumSignNotes("");
                            }}
                            className="flex-row items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 active:opacity-90"
                          >
                            <FileSignature size={13} color="#FFFFFF" />
                            <Text className="text-xs font-bold text-white">
                              {isEn ? "Sign Addendum" : "Ký xác nhận phụ lục"}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 5. Check-out & Deposit Settlement Summary (when applicable) */}
        {isCompletedOrSettled ? (
          <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Check-out & Deposit Settlement" : "Quyết toán Trả kho & Hoàn cọc"}
              </Text>
            </View>

            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 gap-2">
              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Overdue Fee:" : "Phí phạt quá hạn:"}
                </Text>
                <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                  {formatVnd(contract.overdueFee)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Damage / Cleaning Fee:" : "Phí đền bù hư hại / vệ sinh:"}
                </Text>
                <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                  {formatVnd(contract.damageFee)}
                </Text>
              </View>

              <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-0.5">
                <Text className="text-xs font-bold text-brand">
                  {isEn ? "Deposit Refunded to Customer:" : "Tiền cọc hoàn trả khách hàng:"}
                </Text>
                <Text className="text-sm font-extrabold text-brand">
                  {formatVnd(contract.refundAmount)}
                </Text>
              </View>

              {contract.additionalPaymentRequired > 0 ? (
                <View className="flex-row justify-between">
                  <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                    {isEn ? "Additional Payment Required:" : "Số tiền cần thu thêm:"}
                  </Text>
                  <Text className="text-sm font-extrabold text-red-600 dark:text-red-400">
                    {formatVnd(contract.additionalPaymentRequired)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* MODAL 1: VietQR Payment Modal (Walk-in Deposit) */}
      <Modal
        visible={paymentModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white dark:bg-neutral-900 p-5 gap-4 max-h-[88%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Pay Contract Deposit (VietQR)" : "Thanh toán Tiền cọc Hợp đồng (VietQR)"}
              </Text>
              <Pressable onPress={() => setPaymentModalOpen(false)} hitSlop={10}>
                <X size={20} color="#647B80" />
              </Pressable>
            </View>

            {activePayment ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3.5">
                {activePayment.qrUrl ? (
                  <View className="items-center rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white p-4">
                    <Image
                      source={{ uri: activePayment.qrUrl }}
                      style={{ width: 220, height: 220 }}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3.5 gap-1.5">
                  <View className="flex-row justify-between">
                    <Text variant="muted" className="text-xs">
                      {isEn ? "Amount:" : "Số tiền cần chuyển:"}
                    </Text>
                    <Text className="text-sm font-extrabold text-brand">
                      {formatVnd(
                        Math.max(0, activePayment.amount - (activePayment.paidAmount ?? 0))
                      )}
                    </Text>
                  </View>
                  {activePayment.bankInfo ? (
                    <>
                      <View className="flex-row justify-between">
                        <Text variant="muted" className="text-xs">
                          {isEn ? "Bank:" : "Ngân hàng:"}
                        </Text>
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {activePayment.bankInfo.bankCode}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text variant="muted" className="text-xs">
                          {isEn ? "Account No:" : "Số tài khoản:"}
                        </Text>
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {activePayment.bankInfo.accountNumber}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text variant="muted" className="text-xs">
                          {isEn ? "Account Holder:" : "Chủ tài khoản:"}
                        </Text>
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {activePayment.bankInfo.accountName}
                        </Text>
                      </View>
                    </>
                  ) : null}
                  <View className="flex-row justify-between">
                    <Text variant="muted" className="text-xs">
                      {isEn ? "Payment Code:" : "Nội dung CK (Mã TT):"}
                    </Text>
                    <Text className="text-xs font-extrabold text-brand">
                      {activePayment.paymentCode}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleCheckPaymentStatus}
                  disabled={isCheckingPayment}
                  className="flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3 px-4 active:opacity-90"
                >
                  {isCheckingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <RefreshCw size={15} color="#FFFFFF" />
                      <Text className="text-xs font-extrabold text-white">
                        {isEn
                          ? "I Have Transferred — Check Status"
                          : "Tôi đã chuyển khoản — Kiểm tra trạng thái"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Create Contract Addendum Modal (ADD or REMOVE Amenities) */}
      <Modal
        visible={Boolean(addendumModalType)}
        transparent
        animationType="slide"
        onRequestClose={() => setAddendumModalType(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="rounded-t-3xl bg-white dark:bg-neutral-900 p-5 gap-4 max-h-[88%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100 flex-1 pr-2">
                {addendumModalType === ContractAddendumTypeEnum.REMOVE
                  ? isEn
                    ? "Request Amenity Removal / Return"
                    : "Yêu cầu Tháo dỡ / Trả bớt Tiện ích"
                  : isEn
                    ? "Rent Additional Amenities"
                    : "Thuê thêm Tiện ích (Phụ lục ADD)"}
              </Text>
              <Pressable onPress={() => setAddendumModalType(null)} hitSlop={10}>
                <X size={20} color="#647B80" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3">
              {addendumModalType === ContractAddendumTypeEnum.ADD ? (
                isLoadingFacilityAmenities ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="small" color="#0B927E" />
                  </View>
                ) : availableFacilityAmenities.length === 0 ? (
                  <Text variant="muted" className="text-xs text-center py-6">
                    {isEn
                      ? "No available amenities in stock at this facility."
                      : "Cơ sở hiện không còn tiện ích trống trong kho."}
                  </Text>
                ) : (
                  availableFacilityAmenities.map((item) => {
                    const maxQty = Math.max(0, item.availableQuantity ?? 0);
                    const qty = addendumQuantities[item.id] ?? 0;
                    const name = item.amenity?.name ?? item.id;

                    return (
                      <View
                        key={item.id}
                        className="flex-row items-center justify-between rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 p-3"
                      >
                        <View className="flex-1 pr-2">
                          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                            {name}
                          </Text>
                          <Text variant="muted" className="text-[11px]">
                            {formatVnd(item.pricePerUnit)} /{" "}
                            {getRentalUnitLabel(item.billingUnit, currentLocale)} •{" "}
                            {isEn ? `In stock: ${maxQty}` : `Còn: ${maxQty}`}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => adjustAddendumQty(item.id, -1, maxQty)}
                            disabled={qty <= 0}
                            className="h-8 w-8 items-center justify-center rounded-lg border border-neutral-border bg-white dark:bg-neutral-900"
                          >
                            <Minus size={14} color="#0F172A" />
                          </Pressable>
                          <Text className="w-6 text-center text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                            {qty}
                          </Text>
                          <Pressable
                            onPress={() => adjustAddendumQty(item.id, 1, maxQty)}
                            disabled={qty >= maxQty}
                            className="h-8 w-8 items-center justify-center rounded-lg bg-brand"
                          >
                            <Plus size={14} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )
              ) : (
                (contract.amenities ?? []).map((am) => {
                  const pendingRemoveQty = getPendingRemoveAmenityQty(
                    contract,
                    am.facilityAmenityOfferingId
                  );
                  const maxRemovableQty = getMaxRemovableAmenityQty(
                    contract,
                    am.facilityAmenityOfferingId
                  );
                  const qty = addendumQuantities[am.facilityAmenityOfferingId] ?? 0;

                  return (
                    <View
                      key={am.facilityAmenityOfferingId}
                      className="flex-row items-center justify-between rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70 p-3"
                    >
                      <View className="flex-1 pr-2">
                        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                          {am.name}
                        </Text>
                        <Text variant="muted" className="text-[11px]">
                          {isEn ? `Rented: ${am.quantity}` : `Đang thuê: ${am.quantity}`}
                          {pendingRemoveQty > 0
                            ? ` (${isEn ? `Pending remove: ${pendingRemoveQty}` : `Đang chờ trả: ${pendingRemoveQty}`})`
                            : ""}{" "}
                          •{" "}
                          {isEn
                            ? `Max removable: ${maxRemovableQty}`
                            : `Tối đa trả: ${maxRemovableQty}`}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() =>
                            adjustAddendumQty(am.facilityAmenityOfferingId, -1, maxRemovableQty)
                          }
                          disabled={qty <= 0}
                          className="h-8 w-8 items-center justify-center rounded-lg border border-neutral-border bg-white dark:bg-neutral-900"
                        >
                          <Minus size={14} color="#0F172A" />
                        </Pressable>
                        <Text className="w-6 text-center text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                          {qty}
                        </Text>
                        <Pressable
                          onPress={() =>
                            adjustAddendumQty(am.facilityAmenityOfferingId, 1, maxRemovableQty)
                          }
                          disabled={qty >= maxRemovableQty}
                          className="h-8 w-8 items-center justify-center rounded-lg bg-amber-600"
                        >
                          <Plus size={14} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Preview Periodic Adjustment */}
              <View className="rounded-2xl border border-brand/30 bg-brand-light/20 p-3 flex-row items-center justify-between">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {addendumModalType === ContractAddendumTypeEnum.REMOVE
                    ? isEn
                      ? "Periodic Reduction:"
                      : "Số tiền giảm mỗi kỳ:"
                    : isEn
                      ? "Periodic Increase:"
                      : "Tổng tiền tăng thêm mỗi kỳ:"}
                </Text>
                <Text
                  className={`text-sm font-extrabold ${
                    addendumModalType === ContractAddendumTypeEnum.REMOVE
                      ? "text-amber-700"
                      : "text-brand"
                  }`}
                >
                  {addendumModalType === ContractAddendumTypeEnum.REMOVE ? "-" : "+"}
                  {formatVnd(addendumPreviewPeriodicDelta)} / {billingLabel}
                </Text>
              </View>

              <TextInput
                value={addendumNotes}
                onChangeText={setAddendumNotes}
                placeholder={
                  isEn ? "Optional notes..." : "Ghi chú yêu cầu phụ lục (không bắt buộc)..."
                }
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-xs text-neutral-dark dark:text-neutral-100"
              />

              <Pressable
                onPress={handleSubmitCreateAddendum}
                disabled={selectedAddendumItems.length === 0 || createAddendumMutation.isPending}
                className={`flex-row items-center justify-center gap-2 rounded-xl py-3 px-4 ${
                  selectedAddendumItems.length === 0 || createAddendumMutation.isPending
                    ? "bg-neutral-300 dark:bg-neutral-700"
                    : addendumModalType === ContractAddendumTypeEnum.REMOVE
                      ? "bg-amber-600 active:opacity-90"
                      : "bg-brand active:opacity-90"
                }`}
              >
                {createAddendumMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-extrabold text-white">
                    {addendumModalType === ContractAddendumTypeEnum.REMOVE
                      ? isEn
                        ? "Submit Removal Request"
                        : "Gửi yêu cầu tháo dỡ / trả bớt"
                      : isEn
                        ? "Submit Add-Amenity Request"
                        : "Gửi yêu cầu thuê thêm tiện ích"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: Customer Sign Contract Addendum Modal */}
      <Modal
        visible={Boolean(signAddendumTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setSignAddendumTarget(null)}
      >
        <View className="flex-1 justify-center bg-black/50 p-5">
          <View className="rounded-3xl bg-white dark:bg-neutral-900 p-5 gap-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Sign Contract Addendum" : "Ký xác nhận Phụ lục Hợp đồng"}
              </Text>
              <Pressable onPress={() => setSignAddendumTarget(null)} hitSlop={10}>
                <X size={20} color="#647B80" />
              </Pressable>
            </View>

            {signAddendumTarget ? (
              <>
                <Text variant="muted" className="text-xs">
                  #{signAddendumTarget.addendumCode} •{" "}
                  {signAddendumTarget.type === ContractAddendumTypeEnum.REMOVE
                    ? `-${formatVnd(signAddendumTarget.totalPeriodicPrice)}`
                    : `+${formatVnd(signAddendumTarget.totalPeriodicPrice)}`}{" "}
                  / {billingLabel}
                </Text>

                <Pressable
                  onPress={() => setAddendumTermsAccepted((prev) => !prev)}
                  className="flex-row items-start gap-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3"
                >
                  <View
                    className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
                      addendumTermsAccepted
                        ? "border-brand bg-brand"
                        : "border-neutral-400 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    {addendumTermsAccepted ? <Check size={13} color="#FFFFFF" /> : null}
                  </View>
                  <Text className="flex-1 text-xs font-semibold text-neutral-dark dark:text-neutral-200 leading-4">
                    {isEn
                      ? "I confirm the amenity change details and agree to the terms of this contract addendum."
                      : "Tôi xác nhận chi tiết thay đổi tiện ích và đồng ý với các điều khoản của phụ lục hợp đồng này."}
                  </Text>
                </Pressable>

                <TextInput
                  value={addendumSignNotes}
                  onChangeText={setAddendumSignNotes}
                  placeholder={isEn ? "Optional notes..." : "Ghi chú khi ký (không bắt buộc)..."}
                  placeholderTextColor="#94A3B8"
                  className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-dark dark:text-neutral-100"
                />

                <Pressable
                  onPress={handleCustomerSignAddendum}
                  disabled={!addendumTermsAccepted || signAddendumMutation.isPending}
                  className={`flex-row items-center justify-center gap-2 rounded-xl py-3 px-4 ${
                    !addendumTermsAccepted || signAddendumMutation.isPending
                      ? "bg-neutral-300 dark:bg-neutral-700"
                      : "bg-brand active:opacity-90"
                  }`}
                >
                  {signAddendumMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <FileSignature size={15} color="#FFFFFF" />
                      <Text className="text-xs font-extrabold text-white">
                        {isEn ? "Sign Addendum" : "Ký xác nhận phụ lục"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Cancel Contract Addendum Modal */}
      <Modal
        visible={Boolean(cancelAddendumTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelAddendumTarget(null)}
      >
        <View className="flex-1 justify-center bg-black/50 p-5">
          <View className="rounded-3xl bg-white dark:bg-neutral-900 p-5 gap-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Cancel Contract Addendum" : "Hủy Phụ lục Hợp đồng"}
              </Text>
              <Pressable onPress={() => setCancelAddendumTarget(null)} hitSlop={10}>
                <X size={20} color="#647B80" />
              </Pressable>
            </View>

            <TextInput
              value={cancelAddendumReason}
              onChangeText={setCancelAddendumReason}
              placeholder={
                isEn
                  ? "Enter reason for cancelling addendum..."
                  : "Nhập lý do hủy phụ lục hợp đồng..."
              }
              placeholderTextColor="#94A3B8"
              multiline
              className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-xs text-neutral-dark dark:text-neutral-100 min-h-[72px]"
            />

            <Pressable
              onPress={handleCancelAddendum}
              disabled={!cancelAddendumReason.trim() || cancelAddendumMutation.isPending}
              className={`flex-row items-center justify-center gap-2 rounded-xl py-3 px-4 ${
                !cancelAddendumReason.trim() || cancelAddendumMutation.isPending
                  ? "bg-neutral-300 dark:bg-neutral-700"
                  : "bg-red-600 active:opacity-90"
              }`}
            >
              {cancelAddendumMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-xs font-extrabold text-white">
                  {isEn ? "Confirm Cancel Addendum" : "Xác nhận hủy phụ lục"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
