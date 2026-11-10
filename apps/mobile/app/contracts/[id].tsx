import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useFacilityPublicDetail } from "@/features/storage-explore/hooks/useStorageExplore";
import { getPaymentByIdApi } from "@/features/reservations/api/payments.api";
import {
  BillingUnitEnum,
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
  Boxes,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck,
  FileSignature,
  FileText,
  LayoutGrid,
  Layers,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Receipt,
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
  getSignedAddendumFiles,
  getSignedContractFiles,
  isWarehouseRackContract,
  resolveReservationErrorMessage,
} from "@/features/contracts/utils/contractFormat";

function getOffsetDateString(isoString: string | undefined, days: number): string {
  const d = isoString ? new Date(isoString) : new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ContractDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { t, locale } = useTranslation();
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

  // Payment QR Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<PaymentResponse | null>(null);

  // Create Addendum Modal state (ADD / REMOVE)
  const [addendumModalType, setAddendumModalType] = useState<ContractAddendumTypeEnum | null>(null);
  const [addendumQuantities, setAddendumQuantities] = useState<Record<string, number>>({});
  const [addendumNotes, setAddendumNotes] = useState("");

  // Sign Addendum Modal state
  const [signAddendumTarget, setSignAddendumTarget] = useState<ContractAddendumResponse | null>(
    null
  );

  // Cancel Addendum Modal state
  const [cancelAddendumTarget, setCancelAddendumTarget] = useState<ContractAddendumResponse | null>(
    null
  );
  const [cancelAddendumReason, setCancelAddendumReason] = useState("");

  // Request Renewal Modal state
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalNewEndDate, setRenewalNewEndDate] = useState("");
  const [renewalNotes, setRenewalNotes] = useState("");
  const [renewalError, setRenewalError] = useState<string | null>(null);

  // Fullscreen preview image state for signed contract scan
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const handleOpenFile = async (url: string, title?: string) => {
    const isPdf = url.toLowerCase().includes(".pdf");
    if (!isPdf) {
      setPreviewImage({ url, title: title || (isEn ? "Contract Document" : "Tài liệu hợp đồng") });
      return;
    }

    try {
      if (Platform.OS === "web") {
        window.open(url, "_blank");
        return;
      }
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: "#0B927E",
      });
    } catch {
      Linking.openURL(url);
    }
  };

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

  // Auto-poll payment status while modal is open and payment is pending
  useEffect(() => {
    if (
      !paymentModalOpen ||
      !activePayment?.id ||
      activePayment.status !== PaymentStatusEnum.PENDING
    ) {
      return;
    }

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const latest = await getPaymentByIdApi(activePayment.id);
        if (!isSubscribed) return;
        if (latest.status === PaymentStatusEnum.PAID) {
          setActivePayment(latest);
          toast.success(
            isEn
              ? "Payment confirmed! Updating contract..."
              : "Đã xác nhận thanh toán thành công! Đang cập nhật hợp đồng..."
          );
          await refetch();
          setPaymentModalOpen(false);
        } else if (
          latest.status === PaymentStatusEnum.CANCELLED ||
          latest.status === PaymentStatusEnum.EXPIRED
        ) {
          setActivePayment(latest);
        }
      } catch {
        // Silently swallow polling tick errors
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [paymentModalOpen, activePayment?.id, activePayment?.status, isEn, refetch, toast]);

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
      });
      toast.success(
        updated.status === ContractStatusEnum.ACTIVE
          ? isEn
            ? "Contract signed and activated! Your storage unit is ready."
            : "Đã ký xác nhận! Cả 2 bên đã hoàn tất ký, hợp đồng đã kích hoạt sang Đang thuê."
          : isEn
            ? "Contract signed! Waiting for facility staff handover signature."
            : "Bạn đã ký xác nhận hợp đồng! Hợp đồng sẽ kích hoạt ngay khi phía cơ sở ký bàn giao kho."
      );
    } catch (err) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "contract");
      toast.error(resolved.message);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    try {
      await signAddendumMutation.mutateAsync({
        addendumId: signAddendumTarget.id,
        payload: {
          termsAccepted: true,
        },
      });
      toast.success(
        isEn ? "Addendum signed successfully!" : "Đã ký xác nhận phụ lục hợp đồng thành công!"
      );
      setSignAddendumTarget(null);
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

  const hasPendingAddendum = useMemo(() => {
    return (contract?.addendums ?? []).some(
      (a) =>
        a.status === ContractAddendumStatusEnum.PENDING_APPROVAL ||
        a.status === ContractAddendumStatusEnum.DRAFT
    );
  }, [contract?.addendums]);

  const pendingRenewalAddendum = useMemo(() => {
    return (contract?.addendums ?? []).find(
      (a) =>
        a.type === ContractAddendumTypeEnum.RENEW &&
        a.status === ContractAddendumStatusEnum.PENDING_APPROVAL
    );
  }, [contract?.addendums]);

  const draftRenewalAddendum = useMemo(() => {
    return (contract?.addendums ?? []).find(
      (a) =>
        a.type === ContractAddendumTypeEnum.RENEW &&
        a.status === ContractAddendumStatusEnum.DRAFT &&
        !a.customerSigned
    );
  }, [contract?.addendums]);

  const handleRequestRenewal = async () => {
    setRenewalError(null);
    if (!renewalNewEndDate || !/^\d{4}-\d{2}-\d{2}$/.test(renewalNewEndDate)) {
      setRenewalError(
        isEn
          ? "Please enter a valid date (YYYY-MM-DD)."
          : "Vui lòng nhập định dạng ngày YYYY-MM-DD."
      );
      return;
    }
    const isoDate = `${renewalNewEndDate}T23:59:59.999Z`;
    if (contract?.endDate && new Date(isoDate).getTime() <= new Date(contract.endDate).getTime()) {
      setRenewalError(
        isEn
          ? "New end date must be strictly after the current lease end date."
          : "Ngày kết thúc mới phải lớn hơn ngày kết thúc hiện tại của hợp đồng."
      );
      return;
    }
    try {
      await createAddendumMutation.mutateAsync({
        type: ContractAddendumTypeEnum.RENEW,
        newEndDate: isoDate,
        notes: renewalNotes.trim() || undefined,
      });
      setRenewalModalOpen(false);
      toast.success(
        isEn
          ? "Renewal request submitted! Waiting for Facility Manager approval."
          : "Đã gửi yêu cầu gia hạn! Đang chờ Quản lý cơ sở phê duyệt."
      );
      void refetch();
    } catch (err: unknown) {
      const resolved = resolveReservationErrorMessage(err, currentLocale, "renewal");
      setRenewalError(resolved.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <DetailHeader
          title={<Skeleton className="h-6 w-48 rounded-lg bg-white/20" />}
          onBack={handleBack}
        />
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
      <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <DetailHeader
          title={isEn ? "Contract Details" : "Chi tiết hợp đồng thuê kho"}
          onBack={handleBack}
        />
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
  const isWarehouseRack =
    typeof isWarehouseRackContract === "function" ? isWarehouseRackContract(contract) : false;
  const canReportIncident = isActive || contract.status === ContractStatusEnum.OVERDUE;
  const isFromReservation = contract.source === ContractSourceEnum.RESERVATION;
  const isDepositSatisfied = isFromReservation || Boolean(contract.depositPaidAt);
  const isFirstPeriodPaid = Boolean(contract.firstPeriodPaidAt || contract.firstCyclePaidAt);
  const canCustomerSignContract = isDraft && isDepositSatisfied && !contract.customerSigned;

  const isCompletedOrSettled =
    contract.status === ContractStatusEnum.COMPLETED ||
    contract.status === ContractStatusEnum.OVERDUE ||
    contract.status === ContractStatusEnum.TERMINATED ||
    contract.damageFee > 0 ||
    contract.overdueFee > 0 ||
    contract.refundAmount > 0 ||
    contract.additionalPaymentRequired > 0;

  const signedContractFiles = getSignedContractFiles(contract);

  const hasAddendumsWithFiles = (contract?.addendums || []).some(
    (a) => getSignedAddendumFiles(a, contract).length > 0
  );

  const allScanFiles: { url: string; label: string; title: string }[] = [];

  // 1. Contract scans
  signedContractFiles.forEach((f, idx) => {
    allScanFiles.push({
      url: f.url,
      label: hasAddendumsWithFiles
        ? isEn
          ? `Hợp đồng • Trang ${idx + 1}`
          : `Hợp đồng • Trang ${idx + 1}`
        : isEn
          ? `Page ${idx + 1}`
          : `Trang ${idx + 1}`,
      title: isEn ? `Contract scan page ${idx + 1}` : `Bản scan hợp đồng trang ${idx + 1}`,
    });
  });

  // 2. Addendum scans (flat in the exact same list, no inner boxes)
  (contract?.addendums || []).forEach((addendum) => {
    const files = getSignedAddendumFiles(addendum, contract);
    const shortCode = addendum.addendumCode ? addendum.addendumCode.replace(/^ADD-/, "") : "";
    files.forEach((f, fIdx) => {
      allScanFiles.push({
        url: f.url,
        label: shortCode
          ? isEn
            ? `Phụ lục #${shortCode} • Bản ${fIdx + 1}`
            : `Phụ lục #${shortCode} • Bản ${fIdx + 1}`
          : isEn
            ? `Phụ lục • Bản ${fIdx + 1}`
            : `Phụ lục • Bản ${fIdx + 1}`,
        title: isEn
          ? `Addendum #${shortCode} scan ${fIdx + 1}`
          : `Bản scan phụ lục #${shortCode} (${fIdx + 1})`,
      });
    });
  });

  const recurringAmenitiesTotal = (contract.amenities || [])
    .filter((a) => a.billingUnit !== BillingUnitEnum.ONE_TIME)
    .reduce((sum, a) => sum + (a.totalPrice ?? a.pricePerUnit * a.quantity), 0);

  const oneTimeAmenitiesTotal = (contract.amenities || [])
    .filter((a) => a.billingUnit === BillingUnitEnum.ONE_TIME)
    .reduce((sum, a) => sum + (a.totalPrice ?? a.pricePerUnit * a.quantity), 0);

  const totalAmenitiesPrice = recurringAmenitiesTotal + oneTimeAmenitiesTotal;

  const displayPeriodicPrice =
    contract.status === ContractStatusEnum.ACTIVE
      ? contract.totalPeriodicPrice
      : contract.rentalPrice + recurringAmenitiesTotal;

  const firstPeriodTotalAmount =
    contract.rentalPrice + recurringAmenitiesTotal + oneTimeAmenitiesTotal;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Bar with Brand Detail Header */}
      <DetailHeader
        title={`#${contract.contractCode}`}
        subtitle={`${getContractSourceLabel(contract.source, currentLocale)} • ${formatDateTime(contract.createdAt)}`}
        onBack={handleBack}
        rightElement={
          <Badge
            variant="outline"
            className={`border ${statusMeta.badgeBorderClass} ${statusMeta.badgeBgClass} px-3 py-1`}
          >
            <Text className={`text-xs font-bold ${statusMeta.badgeTextClass}`}>
              {statusMeta.label}
            </Text>
          </Badge>
        }
      />

      <ScrollView
        contentContainerClassName="p-4 pb-16 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0B927E" />
        }
      >
        {/* Cancellation Reason Alert */}
        {contract.cancellationReason ? (
          <View className="rounded-3xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 shadow-sm">
            <Text className="text-xs font-bold text-red-700 dark:text-red-300">
              {isEn ? "Cancellation Reason:" : "Lý do hủy hợp đồng:"} {contract.cancellationReason}
            </Text>
          </View>
        ) : null}

        {/* Early Termination Reason Alert */}
        {contract.terminationReason ? (
          <View className="rounded-3xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 shadow-sm">
            <Text className="text-xs font-bold text-red-700 dark:text-red-300">
              {isEn ? "Early Termination Reason:" : "Lý do chấm dứt trước hạn:"}{" "}
              {contract.terminationReason}
            </Text>
          </View>
        ) : null}

        {/* Renewal Status Alerts */}
        {pendingRenewalAddendum ? (
          <View className="rounded-3xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-sm gap-2">
            <View className="flex-row items-center gap-2.5">
              <View className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 items-center justify-center">
                <Clock size={18} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  {isEn ? "Renewal Request Pending Approval" : "Yêu cầu gia hạn đang chờ xét duyệt"}
                </Text>
                <Text className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                  {isEn
                    ? `Renewal request to ${formatDateShort(pendingRenewalAddendum.newEndDate)} is awaiting Facility Manager approval.`
                    : `Yêu cầu gia hạn đến ngày ${formatDateShort(pendingRenewalAddendum.newEndDate)} đang chờ Quản lý cơ sở xét duyệt.`}
                </Text>
              </View>
            </View>
            {pendingRenewalAddendum.notes ? (
              <Text variant="muted" className="text-[10px] pl-10">
                {isEn ? "Notes:" : "Ghi chú:"} {pendingRenewalAddendum.notes}
              </Text>
            ) : null}
          </View>
        ) : null}

        {draftRenewalAddendum ? (
          <View className="rounded-3xl border border-brand/30 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 rounded-2xl bg-brand-light dark:bg-brand/20 items-center justify-center shrink-0 mt-0.5">
                <FileSignature size={20} color="#0B927E" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                  {isEn
                    ? "Renewal Approved - Action Required"
                    : "Yêu cầu gia hạn đã được phê duyệt"}
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-5">
                  {isEn
                    ? `Facility Manager approved renewal to ${formatDateShort(draftRenewalAddendum.newEndDate)}. Please sign to complete the extension.`
                    : `Quản lý cơ sở đã duyệt yêu cầu gia hạn đến ngày ${formatDateShort(draftRenewalAddendum.newEndDate)}. Vui lòng ký xác nhận phụ lục gia hạn để hoàn tất.`}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setSignAddendumTarget(draftRenewalAddendum);
              }}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 px-4 active:opacity-90 shadow-sm"
            >
              <FileSignature size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                {isEn ? "Sign Renewal Addendum" : "Ký phụ lục gia hạn"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* 1B. DRAFT Contract Action Card: Deposit & Dual-Party Signing */}
        {isDraft ? (
          <View className="rounded-3xl border border-brand/40 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3.5">
            <View className="flex-row items-center gap-2">
              <FileSignature size={18} color="#0B927E" />
              <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100 flex-1">
                {isEn ? "Deposit & Dual-Party Contract Signing" : "Tiền cọc & Ký Xác nhận Hợp đồng"}
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

            {/* Step 2: First Period Rent (T1.6 Payable after deposit is satisfied) */}
            <View
              className={`rounded-2xl border p-3 gap-1 ${
                isFirstPeriodPaid
                  ? "border-brand/40 bg-brand-light/25 dark:bg-brand/15"
                  : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 flex-1">
                  {isFirstPeriodPaid ? (
                    <CheckCircle2 size={14} color="#0B927E" />
                  ) : (
                    <Clock size={14} color="#D97706" />
                  )}
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {isEn ? "2. First Period Rent" : "2. Tiền thuê kỳ đầu"}
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-brand">
                  {formatVnd(firstPeriodTotalAmount)}
                </Text>
              </View>

              <Text variant="muted" className="text-[11px]">
                {isFirstPeriodPaid
                  ? `${isEn ? "Paid at:" : "Đã thanh toán lúc:"} ${formatDateTime(
                      contract.firstPeriodPaidAt || contract.firstCyclePaidAt || ""
                    )}`
                  : !isDepositSatisfied
                    ? isEn
                      ? "Payable after security deposit is settled"
                      : "Sẽ mở thanh toán sau khi hoàn tất tiền cọc"
                    : isEn
                      ? "Awaiting first period rent payment"
                      : "Chưa thanh toán tiền thuê kỳ đầu"}
              </Text>

              {!isFirstPeriodPaid && isDepositSatisfied ? (
                <Pressable
                  onPress={() => handleOpenPaymentQr(PaymentPurposeEnum.RENT_FIRST_PERIOD)}
                  disabled={createPaymentMutation.isPending}
                  className="mt-2 flex-row items-center justify-center gap-2 rounded-xl bg-cta py-2.5 px-4 active:opacity-90"
                >
                  {createPaymentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <QrCode size={15} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        {isEn
                          ? "Pay First Period Rent (VietQR)"
                          : "Thanh toán Tiền thuê kỳ đầu (QR)"}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>

            {/* Step 3: Dual-Party Signature Progress */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {isEn ? "3. Dual-Party Signature Progress" : "3. Tiến độ Ký Xác nhận 2 bên"}
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
                      {isEn ? "Facility Staff" : "Phía cơ sở"}
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
                    : "Bạn đã ký xác nhận hợp đồng! Ngay khi phía cơ sở ký xác nhận bàn giao kho, hợp đồng sẽ tự động chuyển sang Đang thuê."}
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
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2 flex-1 min-w-0">
                <Boxes size={16} color="#0B927E" className="shrink-0" />
                <Text
                  numberOfLines={1}
                  className="text-xs font-bold text-neutral-dark dark:text-neutral-100 flex-1"
                >
                  {isEn ? "Assigned Storage Unit" : "Ô kho vật lý"}
                </Text>
              </View>
              <Badge
                variant="outline"
                className="border-brand bg-white dark:bg-neutral-900 px-2.5 py-0.5 shrink-0"
              >
                <Text numberOfLines={1} className="text-xs font-extrabold text-brand">
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

          {canReportIncident ? (
            <View className="flex-row items-center gap-2">
              {isWarehouseRack && isActive ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/contracts/[id]/rack-map" as any,
                      params: { id: contract.id },
                    })
                  }
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 px-3 active:opacity-90"
                >
                  <LayoutGrid size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">{t("rackMap.openButton")}</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/incidents/new",
                    params: { contractId: contract.id },
                  })
                }
                className={
                  isWarehouseRack && isActive
                    ? "flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5 px-3 active:opacity-90"
                    : "w-full flex-row items-center justify-center gap-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 py-3 px-4 active:opacity-90 shadow-sm"
                }
              >
                <ShieldAlert size={16} color="#E11D48" />
                <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {isEn ? "Report Unit Incident" : "Báo cáo sự cố"}
                </Text>
              </Pressable>
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
        </View>

        {/* 3B. Digitized Signed Physical Contract & Addendum Scans (Tách riêng phần tài liệu, không lồng khung) */}
        {allScanFiles.length > 0 ? (
          <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-2 flex-1 min-w-0">
                <FileCheck size={18} color="#0B927E" className="shrink-0" />
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold text-neutral-dark dark:text-neutral-100 flex-1"
                >
                  {isEn ? "Signed Legal Documents" : "Hồ sơ & Tài liệu Ký sống"}
                </Text>
              </View>
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 shrink-0"
              >
                <Text
                  numberOfLines={1}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {allScanFiles.length} {isEn ? "files" : "tài liệu"}
                </Text>
              </Badge>
            </View>

            <Text variant="muted" className="text-xs leading-4">
              {isEn
                ? "Scanned pages of the paper contract and signed addendums with live signatures, stored securely."
                : "Bản scan tài liệu hợp đồng và phụ lục có chữ ký sống của 2 bên đã được số hóa lưu vết toàn vẹn."}
            </Text>

            {/* Flat unified grid: exactly like contract UI, NO nested frame boxes */}
            <View className="flex-row flex-wrap gap-2.5 pt-1">
              {allScanFiles.map((file, idx) => {
                const isPdf =
                  typeof file.url === "string" && file.url.toLowerCase().includes(".pdf");
                return (
                  <Pressable
                    key={`scan-${file.url}-${idx}`}
                    onPress={() => handleOpenFile(file.url, file.title || file.label)}
                    className="w-[48%] rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 items-center justify-center gap-2 overflow-hidden active:opacity-80"
                  >
                    {isPdf ? (
                      <View className="h-28 w-full items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
                        <FileText size={32} color="#EF4444" />
                        <Text className="mt-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                          PDF Document
                        </Text>
                      </View>
                    ) : (
                      <View className="h-28 w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                        <Image
                          source={{ uri: file.url }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <View className="flex-row items-center justify-between w-full px-1">
                      <Text
                        className="text-xs font-semibold text-neutral-dark dark:text-neutral-200 flex-1 mr-1"
                        numberOfLines={1}
                      >
                        {file.label}
                      </Text>
                      <ExternalLink size={13} color="#0B927E" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

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

            {/* Recurring Amenities */}
            {recurringAmenitiesTotal > 0 && (
              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Recurring Amenities:" : "Tiện ích thuê định kỳ:"}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  +{formatVnd(recurringAmenitiesTotal)} / {billingLabel}
                </Text>
              </View>
            )}

            {/* One-time Purchased Amenities */}
            {oneTimeAmenitiesTotal > 0 && (
              <View className="flex-row justify-between items-center">
                <View>
                  <Text variant="muted" className="text-xs font-medium">
                    {isEn ? "One-time Amenities (Period 1):" : "Tiện ích mua 1 lần (thu kỳ 1):"}
                  </Text>
                  <Text variant="muted" className="text-[10px]">
                    {isEn ? "Not billed in future cycles" : "Không tính vào chu kỳ tháng sau"}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  +{formatVnd(oneTimeAmenitiesTotal)}
                </Text>
              </View>
            )}

            {/* Zero Amenities fallback */}
            {totalAmenitiesPrice === 0 && (
              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {isEn ? "Amenities Total:" : "Tổng phí tiện ích:"}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {formatVnd(0)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-0.5">
              <View>
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {isEn ? "Total Periodic Price:" : "Tổng giá thuê định kỳ:"}
                </Text>
                <Text variant="muted" className="text-[10px]">
                  {isEn ? "(Rent + recurring amenities)" : "(Kho cơ bản + tiện ích định kỳ)"}
                </Text>
              </View>
              <Text className="text-sm font-extrabold text-brand">
                {formatVnd(displayPeriodicPrice)} / {billingLabel}
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

            {/* First Period Rent Box */}
            <View
              className={`mt-1 rounded-xl border p-2.5 gap-1 ${
                isFirstPeriodPaid
                  ? "border-brand/30 bg-brand-light/30 dark:bg-brand/15"
                  : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  {isFirstPeriodPaid ? (
                    <CheckCircle2 size={13} color="#0B927E" />
                  ) : (
                    <Clock size={13} color="#D97706" />
                  )}
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {isEn ? "First Period Rent:" : "Tiền thuê kỳ đầu:"}
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-brand">
                  {formatVnd(firstPeriodTotalAmount)}
                </Text>
              </View>

              <Text variant="muted" className="text-[10px]">
                {isFirstPeriodPaid
                  ? `${isEn ? "Paid at:" : "Đã thanh toán lúc:"} ${formatDateTime(
                      contract.firstPeriodPaidAt || contract.firstCyclePaidAt || ""
                    )}`
                  : !isDepositSatisfied
                    ? isEn
                      ? "Payable after security deposit is settled"
                      : "Sẽ mở thanh toán sau khi hoàn tất tiền cọc"
                    : isEn
                      ? "Awaiting first period payment"
                      : "Chưa thanh toán tiền thuê kỳ đầu"}
              </Text>

              {!isFirstPeriodPaid && isDepositSatisfied && (isDraft || isActive) ? (
                <Pressable
                  onPress={() => handleOpenPaymentQr(PaymentPurposeEnum.RENT_FIRST_PERIOD)}
                  disabled={createPaymentMutation.isPending}
                  className="mt-2 flex-row items-center justify-center gap-2 rounded-xl bg-cta py-2 px-3 active:opacity-90"
                >
                  {createPaymentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <QrCode size={14} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        {isEn ? "Pay First Period Rent (QR)" : "Quét mã QR thanh toán kỳ đầu"}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* 4B. Contract Addendums Section (contract.addendums) */}
        <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <FileSignature size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Contract Addendums" : "Phụ lục Hợp đồng"} (
                {contract.addendums?.length ?? 0})
              </Text>
            </View>
            {(contract.status === ContractStatusEnum.ACTIVE ||
              contract.status === ContractStatusEnum.OVERDUE) && (
              <Pressable
                onPress={() => {
                  setRenewalNewEndDate(getOffsetDateString(contract.endDate, 30));
                  setRenewalNotes("");
                  setRenewalError(null);
                  setRenewalModalOpen(true);
                }}
                disabled={hasPendingAddendum}
                className={`flex-row items-center gap-1 rounded-xl bg-brand px-3 py-1.5 active:opacity-90 ${
                  hasPendingAddendum ? "opacity-50" : ""
                }`}
              >
                <Calendar size={13} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  {isEn ? "Request Renewal" : "Yêu cầu gia hạn"}
                </Text>
              </Pressable>
            )}
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

                    {/* Addendum Content (RENEW vs Amenities) */}
                    {addendum.type === ContractAddendumTypeEnum.RENEW ? (
                      <View className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-3 gap-1.5">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-bold text-teal-900 dark:text-teal-200">
                            {isEn ? "New Contract End Date:" : "Thời hạn gia hạn mới:"}
                          </Text>
                          <Text className="text-xs font-extrabold text-teal-800 dark:text-teal-300">
                            {formatDateShort(addendum.newEndDate)}
                          </Text>
                        </View>
                        {isPendingApproval ? (
                          <View className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2 mt-1">
                            <Text className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 leading-4">
                              {isEn
                                ? `• Awaiting Facility Manager approval for extension until ${formatDateShort(addendum.newEndDate)}`
                                : `• Đang chờ Quản lý cơ sở phê duyệt gia hạn đến ngày ${formatDateShort(addendum.newEndDate)}`}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      /* Amenities inside Addendum */
                      <View className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-border dark:border-neutral-800 p-2.5 gap-1.5">
                        {(addendum.amenities ?? []).map((am) => (
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

                        {(addendum.totalPeriodicPrice ?? 0) > 0 ? (
                          <View className="flex-row items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-1.5 mt-0.5">
                            <Text variant="muted" className="text-[11px] font-bold">
                              {isEn ? "Periodic Adjustment:" : "Chênh lệch mỗi kỳ:"}
                            </Text>
                            <Text
                              className={`text-xs font-extrabold ${
                                typeMeta.isRemove
                                  ? "text-amber-700 dark:text-amber-300"
                                  : "text-brand"
                              }`}
                            >
                              {typeMeta.isRemove ? "-" : "+"}
                              {formatVnd(addendum.totalPeriodicPrice)} / {isEn ? "cycle" : "kỳ"}
                            </Text>
                          </View>
                        ) : null}

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
                    )}

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

                    {addendum.notes ? (
                      <Text variant="muted" className="text-[11px]">
                        {isEn ? "Notes:" : "Ghi chú:"} {addendum.notes}
                      </Text>
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
                            }}
                            className="flex-row items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 active:opacity-90"
                          >
                            <FileSignature size={13} color="#FFFFFF" />
                            <Text className="text-xs font-bold text-white">
                              {addendum.type === ContractAddendumTypeEnum.RENEW
                                ? isEn
                                  ? "Sign Renewal"
                                  : "Ký phụ lục gia hạn"
                                : isEn
                                  ? "Sign Addendum"
                                  : "Ký xác nhận phụ lục"}
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
                {activePayment?.purpose === PaymentPurposeEnum.RENT_FIRST_PERIOD
                  ? isEn
                    ? "Pay First Period Rent (VietQR)"
                    : "Thanh toán Tiền thuê kỳ đầu (VietQR)"
                  : isEn
                    ? "Pay Contract Deposit (VietQR)"
                    : "Thanh toán Tiền cọc Hợp đồng (VietQR)"}
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
                  {signAddendumTarget.type === ContractAddendumTypeEnum.RENEW
                    ? `${isEn ? "Extend lease to:" : "Gia hạn đến ngày:"} ${formatDateShort(signAddendumTarget.newEndDate)}`
                    : signAddendumTarget.type === ContractAddendumTypeEnum.REMOVE
                      ? `-${formatVnd(signAddendumTarget.totalPeriodicPrice)} / ${billingLabel}`
                      : (signAddendumTarget.totalPeriodicPrice ?? 0) > 0
                        ? `+${formatVnd(signAddendumTarget.totalPeriodicPrice)} / ${billingLabel}`
                        : isEn
                          ? "One-time Amenities"
                          : "Tiện ích mua 1 lần"}
                </Text>

                <View className="flex-row items-start gap-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3.5">
                  <CheckCircle2 size={18} color="#0B927E" className="mt-0.5 shrink-0" />
                  <Text className="flex-1 text-xs font-semibold text-neutral-dark dark:text-neutral-200 leading-5">
                    {signAddendumTarget.type === ContractAddendumTypeEnum.RENEW
                      ? isEn
                        ? "I confirm and agree to extend the contract lease period as specified in this addendum."
                        : "Tôi xác nhận và đồng ý gia hạn thời gian thuê kho theo các điều khoản của phụ lục này."
                      : isEn
                        ? "I confirm the amenity change details and agree to the terms of this contract addendum."
                        : "Tôi xác nhận chi tiết thay đổi tiện ích và đồng ý với các điều khoản của phụ lục hợp đồng này."}
                  </Text>
                </View>

                {/* Confirm or Cancel Actions */}
                <View className="flex-row items-center gap-2.5 mt-2">
                  <Pressable
                    onPress={() => setSignAddendumTarget(null)}
                    disabled={signAddendumMutation.isPending}
                    className="flex-1 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3.5 items-center justify-center active:opacity-80"
                  >
                    <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                      {isEn ? "Cancel" : "Không"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCustomerSignAddendum}
                    disabled={signAddendumMutation.isPending}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-brand py-3.5 active:opacity-90 shadow-sm"
                  >
                    {signAddendumMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <FileSignature size={15} color="#FFFFFF" />
                        <Text className="text-xs font-bold text-white">
                          {isEn ? "Confirm" : "Xác nhận"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
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

      {/* MODAL 5: Fullscreen Preview Image for Signed Contract Scans */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <SafeAreaView className="flex-1 bg-black/95 justify-between">
          <View className="flex-row items-center justify-between p-4 bg-black/40">
            <Text className="text-sm font-bold text-white flex-1 mr-3" numberOfLines={1}>
              {previewImage?.title}
            </Text>
            <Pressable
              onPress={() => setPreviewImage(null)}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/20 active:opacity-70"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center p-3">
            {previewImage?.url ? (
              <Image
                source={{ uri: previewImage.url }}
                className="h-full w-full"
                resizeMode="contain"
              />
            ) : null}
          </View>

          <View className="p-4 items-center bg-black/40">
            <Pressable
              onPress={() => {
                if (previewImage?.url) {
                  Linking.openURL(previewImage.url);
                }
              }}
              className="flex-row items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 active:opacity-70"
            >
              <ExternalLink size={14} color="#FFFFFF" />
              <Text className="text-xs font-semibold text-white">
                {isEn ? "Open in External Browser" : "Mở trong trình duyệt ngoài"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL 6: Request Lease Renewal Modal (POST /contracts/{id}/addendums type: 'renew') */}
      <Modal
        visible={renewalModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRenewalModalOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/50 p-5">
          <View className="rounded-3xl bg-white dark:bg-neutral-900 p-5 gap-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Calendar size={18} color="#0B927E" />
                <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
                  {isEn ? "Request Lease Extension" : "Yêu cầu gia hạn hợp đồng"}
                </Text>
              </View>
              <Pressable onPress={() => setRenewalModalOpen(false)} hitSlop={10}>
                <X size={20} color="#647B80" />
              </Pressable>
            </View>

            <View className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-3 gap-1">
              <Text variant="muted" className="text-xs">
                {isEn ? "Current Lease End Date:" : "Ngày hết hạn thuê hiện tại:"}
              </Text>
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {formatDateShort(contract?.endDate)}
              </Text>
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "New End Date (YYYY-MM-DD) *" : "Ngày kết thúc gia hạn mới (YYYY-MM-DD) *"}
              </Text>
              <TextInput
                value={renewalNewEndDate}
                onChangeText={(val) => {
                  setRenewalNewEndDate(val);
                  setRenewalError(null);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-xs font-bold text-neutral-dark dark:text-neutral-100"
              />
              <View className="flex-row flex-wrap gap-1.5 mt-1">
                {[30, 60, 90, 180].map((days) => {
                  const targetDate = getOffsetDateString(contract?.endDate, days);
                  const isSelected = renewalNewEndDate === targetDate;
                  return (
                    <Pressable
                      key={days}
                      onPress={() => {
                        setRenewalNewEndDate(targetDate);
                        setRenewalError(null);
                      }}
                      className={`rounded-lg px-2.5 py-1 border ${
                        isSelected
                          ? "bg-brand/10 border-brand"
                          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-border dark:border-neutral-700"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          isSelected ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        +{days} {isEn ? "days" : "ngày"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-1.5">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Reason for Extension (Optional)" : "Lý do gia hạn (Không bắt buộc)"}
              </Text>
              <TextInput
                value={renewalNotes}
                onChangeText={setRenewalNotes}
                placeholder={
                  isEn
                    ? "e.g. Need more time to store household goods..."
                    : "VD: Cần lưu trữ đồ đạc gia đình thêm thời gian..."
                }
                placeholderTextColor="#94A3B8"
                multiline
                className="rounded-xl border border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-dark dark:text-neutral-100 min-h-[64px]"
              />
            </View>

            {renewalError ? (
              <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
                {renewalError}
              </Text>
            ) : null}

            <Pressable
              onPress={handleRequestRenewal}
              disabled={createAddendumMutation.isPending}
              className={`flex-row items-center justify-center gap-2 rounded-xl py-3 px-4 ${
                createAddendumMutation.isPending
                  ? "bg-neutral-300 dark:bg-neutral-700"
                  : "bg-brand active:opacity-90"
              }`}
            >
              {createAddendumMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Calendar size={14} color="#FFFFFF" />
                  <Text className="text-xs font-extrabold text-white">
                    {isEn ? "Submit Renewal Request" : "Gửi yêu cầu gia hạn"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
