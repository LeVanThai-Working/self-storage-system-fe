import React from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { SkuForm } from "@/features/customer-sku/components/SkuForm";
import {
  useCustomerSku,
  useUpdateCustomerSku,
} from "@/features/customer-sku/hooks/useCustomerSkus";
import { useSkuFormSubmit } from "@/features/customer-sku/hooks/useSkuFormSubmit";

/** C11 — edit an existing SKU. */
export default function EditSkuScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const skuQuery = useCustomerSku(id);
  const updateMutation = useUpdateCustomerSku(id);
  const { serverError, clearServerError, handleError } = useSkuFormSubmit();

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <X size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {t("sku.form.editTitle")}
        </Text>
      </View>

      {skuQuery.data ? (
        <SkuForm
          initial={skuQuery.data}
          editingId={id}
          submitting={updateMutation.isPending}
          submitLabel={t("sku.form.saveChanges")}
          serverError={serverError}
          onCancel={() => router.back()}
          onSubmit={async (payload) => {
            clearServerError();
            try {
              await updateMutation.mutateAsync(payload);
              toast.success(t("sku.form.updated"));
              router.back();
            } catch (error) {
              handleError(error);
            }
          }}
        />
      ) : (
        <View className="gap-3 p-4">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </View>
      )}
    </SafeAreaView>
  );
}
