import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  ShieldCheck,
  XCircle,
  Ban,
  Receipt,
} from "lucide-react-native";
import { useTranslation } from "@/stores/language.store";
import { useCustomerRefundDetail } from "@/features/refunds/hooks/useRefunds";
import { RefundStatusBadge } from "@/features/refunds/components/RefundStatusBadge";
import { CancelRefundModal } from "@/features/refunds/components/CancelRefundModal";
import {
  formatDate,
  formatVnd,
  getMobileRefundReasonLabel,
} from "@/features/refunds/utils/refundFormat";
import { ESTIMATED_SLA_DAYS, RefundRequestStatusEnum } from "@self-storage-system-fe/shared";

export default function CustomerRefundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useTranslation();
  const isEn = locale === "en";

  const { data: refund, isLoading, isError, refetch, isRefetching } = useCustomerRefundDetail(id);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0B927E" />
        <Text className="mt-3 text-sm text-muted-foreground">
          {isEn ? "Loading refund details..." : "Đang tải thông tin hoàn tiền..."}
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !refund) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
        <XCircle size={48} color="#EF4444" />
        <Text className="text-base font-bold text-foreground mt-3 text-center">
          {isEn ? "Refund request not found" : "Không tìm thấy yêu cầu hoàn tiền"}
        </Text>
        <Text className="text-xs text-muted-foreground mt-1 text-center">
          {isEn
            ? "The request does not exist or has been removed."
            : "Yêu cầu không tồn tại hoặc bạn không có quyền truy cập."}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-5 px-6 py-2.5 rounded-full bg-brand">
          <Text className="text-white font-semibold text-sm">{isEn ? "Go Back" : "Quay lại"}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isPendingApproval = refund.status === RefundRequestStatusEnum.PENDING_APPROVAL;
  const isPaid = refund.status === RefundRequestStatusEnum.PAID;
  const isApproved = refund.status === RefundRequestStatusEnum.APPROVED;

  const facilityName =
    typeof refund.facility === "object" ? refund.facility?.name : refund.facility || "—";

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="flex-row items-center gap-1.5"
        >
          <ArrowLeft size={20} color="#0B927E" />
          <Text className="text-sm font-semibold text-brand">{isEn ? "Back" : "Quay lại"}</Text>
        </Pressable>

        <Text className="font-bold text-sm text-foreground">
          {isEn ? "Refund Details" : "Chi tiết hoàn tiền"}
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerClassName="p-4 pb-20 space-y-4"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0B927E" />
        }
      >
        {/* Main Status & Amount Card */}
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardContent className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  {isEn ? "Refund Code" : "Mã hoàn tiền"}
                </Text>
                <Text className="font-mono text-base font-extrabold text-foreground mt-0.5">
                  {refund.refundCode}
                </Text>
              </View>
              <RefundStatusBadge status={refund.status} />
            </View>

            <View className="my-2 p-4 rounded-xl bg-brand/5 border border-brand/15 items-center">
              <Text className="text-xs text-muted-foreground font-medium mb-1">
                {isEn ? "Total Refund Amount" : "Tổng số tiền hoàn lại"}
              </Text>
              <Text className="text-3xl font-black text-brand-dark dark:text-brand-light">
                {formatVnd(refund.amount)}
              </Text>
            </View>

            <View className="mt-2 bg-muted/30 p-2.5 rounded-lg">
              <Text className="text-xs text-muted-foreground font-medium">
                <Text className="font-semibold text-foreground">
                  {isEn ? "Reason: " : "Lý do: "}
                </Text>
                {getMobileRefundReasonLabel(refund.reason, isEn)}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* SLA Commitment Banner (Rule 5 from specification) */}
        <View className="flex-row items-start gap-2.5 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
          <ShieldCheck size={20} color="#0B927E" className="mt-0.5" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-teal-900 dark:text-teal-200">
              {isEn ? "Processing SLA Commitment" : "Cam kết thời gian xử lý"}
            </Text>
            <Text className="text-xs text-teal-800 dark:text-teal-300 mt-0.5 leading-relaxed">
              {isEn
                ? `Estimated refund processing time is within ${ESTIMATED_SLA_DAYS} business days once approved.`
                : `Thời gian hoàn tiền dự kiến trong vòng ${ESTIMATED_SLA_DAYS} ngày làm việc kể từ khi yêu cầu được phê duyệt.`}
            </Text>
          </View>
        </View>

        {/* Bank Account Info Card (Rule 4: Masked Account Number) */}
        <Card className="border border-border/80 bg-card">
          <CardContent className="p-4 space-y-3">
            <View className="flex-row items-center gap-2 mb-1">
              <CreditCard size={18} color="#0B927E" />
              <Text className="font-bold text-sm text-foreground">
                {isEn ? "Receiving Bank Account" : "Tài khoản nhận tiền"}
              </Text>
            </View>

            <View className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/60">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">
                  {isEn ? "Bank Name:" : "Ngân hàng:"}
                </Text>
                <Text className="text-xs font-semibold text-foreground">
                  {refund.refundBankName || "—"}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">
                  {isEn ? "Account Number:" : "Số tài khoản:"}
                </Text>
                <Text className="text-xs font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded">
                  {refund.refundAccountNumberMasked || "—"}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">
                  {isEn ? "Account Holder:" : "Chủ tài khoản:"}
                </Text>
                <Text className="text-xs font-semibold text-foreground uppercase">
                  {refund.refundAccountHolder || "—"}
                </Text>
              </View>
            </View>

            <Text className="text-[11px] text-muted-foreground italic">
              *{" "}
              {isEn
                ? "Account numbers are masked per Decree 13/2023/ND-CP for personal data protection."
                : "Số tài khoản được che mặt nạ theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân."}
            </Text>
          </CardContent>
        </Card>

        {/* Paid Details / Proof (if status = PAID) */}
        {isPaid && (
          <Card className="border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 space-y-2">
              <View className="flex-row items-center gap-2 mb-1">
                <CheckCircle2 size={18} color="#10B981" />
                <Text className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  {isEn ? "Payout Confirmed" : "Đã hoàn tất thanh toán"}
                </Text>
              </View>

              <View className="flex-row justify-between text-xs py-1">
                <Text className="text-muted-foreground">
                  {isEn ? "Bank Ref Code:" : "Mã giao dịch ngân hàng:"}
                </Text>
                <Text className="font-mono font-bold text-foreground">
                  {refund.referenceCode || "—"}
                </Text>
              </View>

              {refund.paidAt && (
                <View className="flex-row justify-between text-xs py-1">
                  <Text className="text-muted-foreground">
                    {isEn ? "Paid Date:" : "Thời gian chi trả:"}
                  </Text>
                  <Text className="text-foreground">{formatDate(refund.paidAt)}</Text>
                </View>
              )}

              {refund.proofImageUrl && (
                <Pressable
                  onPress={() => Linking.openURL(refund.proofImageUrl!)}
                  className="flex-row items-center gap-1.5 pt-2"
                >
                  <ExternalLink size={14} color="#0B927E" />
                  <Text className="text-xs font-semibold text-brand underline">
                    {isEn ? "View bank transfer receipt" : "Xem biên lai chuyển tiền"}
                  </Text>
                </Pressable>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rejection / Cancellation details */}
        {refund.rejectionReason && (
          <View className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-xl space-y-1">
            <Text className="text-xs font-bold text-rose-800 dark:text-rose-200">
              {isEn ? "Rejection Reason:" : "Lý do từ chối:"}
            </Text>
            <Text className="text-xs text-rose-700 dark:text-rose-300">
              {refund.rejectionReason}
            </Text>
          </View>
        )}

        {refund.cancellationReason && (
          <View className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-1">
            <Text className="text-xs font-bold text-muted-foreground">
              {isEn ? "Cancellation Reason:" : "Lý do hủy yêu cầu:"}
            </Text>
            <Text className="text-xs text-foreground">{refund.cancellationReason}</Text>
          </View>
        )}

        {/* Associated Storage Facility */}
        <Card className="border border-border/80 bg-card">
          <CardContent className="p-4 space-y-2">
            <View className="flex-row items-center gap-2">
              <Building2 size={16} color="#647B80" />
              <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                {isEn ? "Facility" : "Cơ sở lưu kho"}
              </Text>
            </View>
            <Text className="font-semibold text-sm text-foreground">{facilityName}</Text>
          </CardContent>
        </Card>

        {/* Workflow Timeline */}
        <Card className="border border-border/80 bg-card">
          <CardContent className="p-4 space-y-3">
            <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              {isEn ? "Request Timeline" : "Tiến trình xử lý"}
            </Text>

            <View className="space-y-2.5 text-xs">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Clock size={13} color="#94A3B8" />
                  <Text className="text-muted-foreground">
                    {isEn ? "Requested at:" : "Ngày tạo yêu cầu:"}
                  </Text>
                </View>
                <Text className="font-medium text-foreground">
                  {formatDate(refund.requestedAt || refund.createdAt)}
                </Text>
              </View>

              {refund.approvedAt && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={13} color="#3B82F6" />
                    <Text className="text-muted-foreground">
                      {isEn ? "Approved at:" : "Ngày phê duyệt:"}
                    </Text>
                  </View>
                  <Text className="font-medium text-foreground">
                    {formatDate(refund.approvedAt)}
                  </Text>
                </View>
              )}

              {refund.paidAt && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={13} color="#10B981" />
                    <Text className="text-muted-foreground">
                      {isEn ? "Completed at:" : "Ngày giải ngân:"}
                    </Text>
                  </View>
                  <Text className="font-medium text-foreground">{formatDate(refund.paidAt)}</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Cancel Action Button (only when pending approval) */}
        {isPendingApproval && (
          <Pressable
            onPress={() => setIsCancelModalOpen(true)}
            className="w-full py-3.5 rounded-xl border border-destructive/40 bg-destructive/10 items-center justify-center active:bg-destructive/20 mt-2"
          >
            <View className="flex-row items-center gap-2">
              <Ban size={16} color="#EF4444" />
              <Text className="text-sm font-bold text-destructive">
                {isEn ? "Cancel Refund Request" : "Hủy yêu cầu hoàn tiền"}
              </Text>
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* Cancel Refund Modal */}
      <CancelRefundModal
        visible={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        refund={refund}
        onSuccess={() => {
          refetch();
        }}
      />
    </SafeAreaView>
  );
}
