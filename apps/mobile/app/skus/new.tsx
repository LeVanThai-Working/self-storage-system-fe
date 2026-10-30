import React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { SkuForm } from "@/features/customer-sku/components/SkuForm";
import { useCreateCustomerSku } from "@/features/customer-sku/hooks/useCustomerSkus";
import { useSkuFormSubmit } from "@/features/customer-sku/hooks/useSkuFormSubmit";

/** C11 — create a SKU (optionally prefilled with a scanned barcode). */
export default function NewSkuScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ barcode?: string }>();
  const createMutation = useCreateCustomerSku();
  const { serverError, clearServerError, handleError } = useSkuFormSubmit();

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <X size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {t("sku.form.createTitle")}
        </Text>
      </View>

      <SkuForm
        initial={params.barcode ? { barcode: params.barcode } : undefined}
        submitting={createMutation.isPending}
        submitLabel={t("sku.form.save")}
        serverError={serverError}
        onCancel={() => router.back()}
        onSubmit={async (payload) => {
          clearServerError();
          try {
            const sku = await createMutation.mutateAsync(payload);
            toast.success(t("sku.form.created", { code: sku.skuCode }));
            router.replace({ pathname: "/skus/[id]", params: { id: sku.id } });
          } catch (error) {
            handleError(error);
          }
        }}
      />
    </SafeAreaView>
  );
}
