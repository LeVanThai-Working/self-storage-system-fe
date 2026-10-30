import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeftRight,
  Box,
  CircleAlert,
  ClipboardList,
  CreditCard,
  FileText,
  Info,
  Lock,
  MessageCircleMore,
  X,
  type LucideIcon,
} from "lucide-react-native";
import {
  CloudinaryFolderEnum,
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  createSupportTicketSchema,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { ImagePickerField } from "@/components/ui/image-picker-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { ContractPicker } from "@/features/contracts/components/ContractPicker";
import { useCreateSupportTicket } from "@/features/support-tickets/hooks/useSupportTickets";
import { resolveRequestError } from "@/features/inventory-requests/utils/requestFormat";

const MAX_ATTACHMENTS = 5;

const CATEGORY_ICON: Record<SupportTicketCategoryEnum, LucideIcon> = {
  [SupportTicketCategoryEnum.BILLING_INQUIRY]: CreditCard,
  [SupportTicketCategoryEnum.CONTRACT_INQUIRY]: FileText,
  [SupportTicketCategoryEnum.UNIT_CHANGE_REQUEST]: Box,
  [SupportTicketCategoryEnum.ACCESS_PIN_RESET]: Lock,
  [SupportTicketCategoryEnum.SERVICE_COMPLAINT]: CircleAlert,
  [SupportTicketCategoryEnum.PROCEDURAL_ASSISTANCE]: ClipboardList,
  [SupportTicketCategoryEnum.GENERAL_INQUIRY]: MessageCircleMore,
  [SupportTicketCategoryEnum.INVENTORY_MOVE_REQUEST]: ArrowLeftRight,
};
/** Move requests are raised from the rack map (move-request screen), not from this form. */
const PICKABLE_CATEGORIES = Object.values(SupportTicketCategoryEnum).filter(
  (value) => value !== SupportTicketCategoryEnum.INVENTORY_MOVE_REQUEST
);
const inputClass =
  "rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

/** H2 — new support ticket. */
export default function NewSupportTicketScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const params = useLocalSearchParams<{ contractId?: string }>();
  const createMutation = useCreateSupportTicket();

  const [category, setCategory] = useState<SupportTicketCategoryEnum>(
    SupportTicketCategoryEnum.GENERAL_INQUIRY
  );
  const [contractId, setContractId] = useState(params.contractId ?? "");
  const [priority, setPriority] = useState<SupportTicketPriorityEnum>(
    SupportTicketPriorityEnum.MEDIUM
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!contractId) {
      setError(t("supportTicket.form.contractRequired"));
      return;
    }
    const payload = {
      category,
      contractId,
      priority,
      title: title.trim(),
      description: description.trim(),
      attachments,
    };
    const parsed = createSupportTicketSchema.safeParse(payload);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === "title"
          ? t("supportTicket.form.titleInvalid")
          : field === "description"
            ? t("supportTicket.form.descriptionInvalid")
            : (parsed.error.issues[0]?.message ?? null)
      );
      return;
    }
    try {
      const ticket = await createMutation.mutateAsync(payload);
      toast.success(t("supportTicket.form.created", { code: ticket.ticketCode }));
      router.replace({ pathname: "/support-tickets/[id]", params: { id: ticket.id } });
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <X size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {t("supportTicket.form.title")}
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-32" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <FieldLabel>{t("supportTicket.form.category")} *</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {PICKABLE_CATEGORIES.map((value) => {
              const selected = value === category;
              const Icon = CATEGORY_ICON[value];
              return (
                <Pressable
                  key={value}
                  onPress={() => setCategory(value)}
                  className={cn(
                    "w-[31.5%] flex-row items-center gap-1.5 rounded-xl border px-2 py-2.5 active:opacity-80",
                    selected
                      ? "border-brand bg-brand-bg dark:bg-brand/10"
                      : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  )}
                >
                  <Icon size={15} color={selected ? "#0B927E" : "#647B80"} />
                  <Text
                    numberOfLines={2}
                    className={cn(
                      "flex-1 text-[11px] font-bold",
                      selected ? "text-brand" : "text-neutral-dark dark:text-neutral-200"
                    )}
                  >
                    {t(`supportTicket.category.${value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("supportTicket.form.contract")} *</FieldLabel>
          <ContractPicker value={contractId} onChange={(contract) => setContractId(contract.id)} />
          <Text variant="muted" className="text-[11px]">
            {t("supportTicket.form.contractHint")}
          </Text>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("supportTicket.form.priority")}</FieldLabel>
          <View className="flex-row rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {Object.values(SupportTicketPriorityEnum).map((value) => {
              const selected = value === priority;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPriority(value)}
                  className={cn(
                    "flex-1 items-center rounded-lg py-2",
                    selected && "bg-white shadow-sm dark:bg-neutral-900"
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-bold",
                      selected ? "text-brand" : "text-neutral-muted"
                    )}
                  >
                    {t(`supportTicket.priority.${value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("supportTicket.form.subject")} *</FieldLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            placeholder={t("supportTicket.form.subjectPlaceholder")}
            placeholderTextColor="#94A3B8"
            className={inputClass}
          />
          <Text variant="muted" className="self-end text-[10px]">
            {title.length}/200
          </Text>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("supportTicket.form.description")} *</FieldLabel>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={3000}
            placeholder={t("supportTicket.form.descriptionPlaceholder")}
            placeholderTextColor="#94A3B8"
            className={cn(inputClass, "min-h-[120px]")}
            style={{ textAlignVertical: "top" }}
          />
          <Text variant="muted" className="self-end text-[10px]">
            {description.length}/3000
          </Text>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("supportTicket.form.attachments", { max: MAX_ATTACHMENTS })}</FieldLabel>
          <ImagePickerField
            value={attachments}
            onChange={setAttachments}
            folder={CloudinaryFolderEnum.SUPPORT_TICKETS}
            max={MAX_ATTACHMENTS}
          />
        </View>

        <View className="flex-row items-start gap-2 rounded-2xl border border-brand/20 bg-brand-bg p-3 dark:bg-brand/10">
          <Info size={16} color="#0B927E" />
          <Text className="flex-1 text-[11px] leading-4 text-neutral-700 dark:text-neutral-200">
            {t("supportTicket.form.hint")}
          </Text>
        </View>

        <FieldError message={error} />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row gap-2.5 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 items-center rounded-xl border border-neutral-border py-3 active:opacity-70 dark:border-neutral-700"
        >
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-200">
            {t("common.cancel")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={createMutation.isPending}
          className={cn(
            "flex-[2] items-center rounded-xl bg-cta py-3 active:opacity-80",
            createMutation.isPending && "opacity-60"
          )}
        >
          <Text className="text-sm font-bold text-white">
            {createMutation.isPending ? t("common.loading") : t("supportTicket.form.submit")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
