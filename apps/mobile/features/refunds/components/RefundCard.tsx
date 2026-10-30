import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Clock, Building2, CreditCard } from "lucide-react-native";
import { useTranslation } from "@/stores/language.store";
import { RefundStatusBadge } from "./RefundStatusBadge";
import { formatDate, formatVnd, getMobileRefundReasonLabel } from "../utils/refundFormat";
import type { RefundRequestResponse } from "@self-storage-system-fe/shared";

interface RefundCardProps {
  refund: RefundRequestResponse;
}

export const RefundCard: React.FC<RefundCardProps> = ({ refund }) => {
  const router = useRouter();
  const { locale } = useTranslation();
  const isEn = locale === "en";

  const facilityName =
    typeof refund.facility === "object" ? refund.facility?.name : refund.facility || "—";

  return (
    <Card className="mb-3 border border-border/80 bg-card active:scale-[0.99] transition-transform">
      <Pressable onPress={() => router.push(`/refunds/${refund.id}` as any)} className="p-4">
        <CardContent className="p-0">
          {/* Top row: Code + Status Badge */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-mono font-bold text-sm text-foreground">{refund.refundCode}</Text>
            <RefundStatusBadge status={refund.status} />
          </View>

          {/* Amount */}
          <View className="mb-2.5">
            <Text className="text-xl font-extrabold text-brand-dark dark:text-brand-light">
              {formatVnd(refund.amount)}
            </Text>
          </View>

          {/* Reason */}
          <View className="mb-3 bg-muted/30 p-2 rounded-lg">
            <Text className="text-xs text-muted-foreground font-medium">
              {getMobileRefundReasonLabel(refund.reason, isEn)}
            </Text>
          </View>

          {/* Bank Info snapshot */}
          <View className="flex-row items-center gap-2 mb-2">
            <CreditCard size={14} color="#647B80" />
            <Text className="text-xs text-muted-foreground">
              {refund.refundBankName || "Ngân hàng"}:{" "}
              <Text className="font-mono font-semibold text-foreground">
                {refund.refundAccountNumberMasked || "—"}
              </Text>
            </Text>
          </View>

          {/* Footer: Date & Facility & Action indicator */}
          <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
            <View className="flex-row items-center gap-1.5">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-[11px] text-muted-foreground">
                {formatDate(refund.requestedAt || refund.createdAt)}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-semibold text-brand">
                {isEn ? "View Details" : "Chi tiết"}
              </Text>
              <ChevronRight size={14} color="#0B927E" />
            </View>
          </View>
        </CardContent>
      </Pressable>
    </Card>
  );
};
