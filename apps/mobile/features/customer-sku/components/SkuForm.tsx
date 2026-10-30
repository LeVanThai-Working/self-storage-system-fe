import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { Barcode, Box } from "lucide-react-native";
import {
  CloudinaryFolderEnum,
  CustomerSkuStatusEnum,
  createCustomerSkuSchema,
  type CreateCustomerSkuRequest,
  type CustomerSkuResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ImagePickerField } from "@/components/ui/image-picker-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { BarcodeScannerView } from "@/features/customer-inventory/components/BarcodeScannerView";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { useLookupSkuByBarcode } from "../hooks/useCustomerSkus";
import {
  SKU_CATEGORY_PRESETS,
  SKU_DEFAULT_UOM,
  SKU_ERROR,
  SKU_UOM_PRESETS,
  computeSkuVolume,
  formatSkuVolume,
  isApiErrorCode,
} from "../utils/skuFormat";

type FieldKey = "skuCode" | "name" | "barcode" | "dimensions" | "weightKg" | "form";

interface SkuFormProps {
  /** Existing SKU when editing; prefilled values otherwise. */
  initial?: Partial<CustomerSkuResponse>;
  editingId?: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateCustomerSkuRequest) => void;
  onCancel: () => void;
  /** Field error coming back from BE (611 / 612). */
  serverError?: { field: FieldKey; message: string } | null;
}

function toNumber(value: string): number | undefined {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function toText(value?: number | null): string {
  return value || value === 0 ? String(value).replace(".", ",") : "";
}

/** C11 — create / edit SKU form. Validates with the shared schema before calling `onSubmit`. */
export function SkuForm({
  initial,
  editingId,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
  serverError,
}: SkuFormProps) {
  const { t } = useTranslation();
  const lookupBarcode = useLookupSkuByBarcode();

  const [images, setImages] = useState<string[]>(initial?.imageUrl ? [initial.imageUrl] : []);
  const [skuCode, setSkuCode] = useState(initial?.skuCode ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [uom, setUom] = useState(initial?.uom ?? SKU_DEFAULT_UOM);
  const [length, setLength] = useState(toText(initial?.dimensions?.length));
  const [width, setWidth] = useState(toText(initial?.dimensions?.width));
  const [height, setHeight] = useState(toText(initial?.dimensions?.height));
  const [weight, setWeight] = useState(toText(initial?.weightKg));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.status !== CustomerSkuStatusEnum.INACTIVE);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [scanning, setScanning] = useState(false);

  const volume = useMemo(
    () =>
      computeSkuVolume({
        length: toNumber(length),
        width: toNumber(width),
        height: toNumber(height),
      }),
    [length, width, height]
  );

  const fieldError = (key: FieldKey) =>
    errors[key] ?? (serverError?.field === key ? serverError.message : undefined);

  /** Warns early when the barcode already belongs to another SKU of this customer. */
  const checkBarcode = async (value: string) => {
    const code = value.trim();
    if (!code || code === initial?.barcode) return;
    try {
      const found = await lookupBarcode(code);
      if (found && found.id !== editingId) {
        setErrors((prev) => ({
          ...prev,
          barcode: t("sku.form.barcodeTaken", { code: found.skuCode }),
        }));
      }
    } catch (error) {
      if (!isApiErrorCode(error, SKU_ERROR.NOT_FOUND)) return;
      setErrors((prev) => ({ ...prev, barcode: undefined }));
    }
  };

  const handleSubmit = () => {
    const l = toNumber(length);
    const w = toNumber(width);
    const h = toNumber(height);
    const anyDimension = l !== undefined || w !== undefined || h !== undefined;
    const weightValue = toNumber(weight);

    const payload: CreateCustomerSkuRequest = {
      skuCode: skuCode.trim().toUpperCase(),
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      category: category.trim() || undefined,
      uom: uom.trim() || SKU_DEFAULT_UOM,
      dimensions: anyDimension
        ? { length: l ?? NaN, width: w ?? NaN, height: h ?? NaN }
        : undefined,
      weightKg: weightValue,
      imageUrl: images[0] ?? (editingId ? "" : undefined),
      description: description.trim() || undefined,
      status: active ? CustomerSkuStatusEnum.ACTIVE : CustomerSkuStatusEnum.INACTIVE,
    };

    const parsed = createCustomerSkuSchema.safeParse(payload);
    const next: Partial<Record<FieldKey, string>> = {};
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (key === "skuCode" || key === "name" || key === "barcode" || key === "weightKg") {
          next[key] ??= t(`sku.form.errors.${key}`);
        } else if (key === "dimensions") {
          next.dimensions ??= t("sku.form.errors.dimensions");
        } else {
          next.form ??= issue.message;
        }
      });
    }
    if (errors.barcode) next.barcode = errors.barcode;
    setErrors(next);
    if (Object.keys(next).length > 0 || !parsed.success) return;
    onSubmit(payload);
  };

  const renderChips = (
    options: readonly string[],
    value: string,
    onChange: (next: string) => void
  ) => (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(selected ? "" : option)}
            className={cn(
              "rounded-full border px-3 py-1.5 active:opacity-80",
              selected
                ? "border-brand bg-brand"
                : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold",
                selected ? "text-white" : "text-neutral-dark dark:text-neutral-200"
              )}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const inputClass =
    "rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

  const renderDimension = (label: string, value: string, onChange: (next: string) => void) => (
    <View className="flex-1 gap-1">
      <Text variant="muted" className="text-[11px]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="cm"
        placeholderTextColor="#94A3B8"
        className={inputClass}
      />
    </View>
  );

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <FieldLabel>{t("sku.form.image")}</FieldLabel>
          <ImagePickerField
            value={images}
            onChange={setImages}
            folder={CloudinaryFolderEnum.CUSTOMER_SKUS}
            max={1}
            size={80}
          />
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.skuCode")} *</FieldLabel>
          <TextInput
            value={skuCode}
            onChangeText={(value) => setSkuCode(value.toUpperCase())}
            autoCapitalize="characters"
            placeholder="SKU-TEA-01"
            placeholderTextColor="#94A3B8"
            className={inputClass}
          />
          <FieldError message={fieldError("skuCode")} />
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.name")} *</FieldLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("sku.form.namePlaceholder")}
            placeholderTextColor="#94A3B8"
            className={inputClass}
          />
          <FieldError message={fieldError("name")} />
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.barcode")}</FieldLabel>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={barcode}
              onChangeText={(value) => {
                setBarcode(value);
                setErrors((prev) => ({ ...prev, barcode: undefined }));
              }}
              onBlur={() => void checkBarcode(barcode)}
              keyboardType="number-pad"
              placeholder="8934567890123"
              placeholderTextColor="#94A3B8"
              className={cn(inputClass, "flex-1")}
            />
            <Pressable
              onPress={() => setScanning(true)}
              className="h-11 w-11 items-center justify-center rounded-xl border border-brand/40 bg-brand-light/40 active:opacity-70"
            >
              <Barcode size={20} color="#0B927E" />
            </Pressable>
          </View>
          <FieldError message={fieldError("barcode")} />
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.category")}</FieldLabel>
          {renderChips(SKU_CATEGORY_PRESETS, category, setCategory)}
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.uom")}</FieldLabel>
          {renderChips(SKU_UOM_PRESETS, uom, (next) => setUom(next || SKU_DEFAULT_UOM))}
        </View>

        <View className="gap-2">
          <FieldLabel>{t("sku.form.sizeSection")}</FieldLabel>
          <View className="flex-row gap-2">
            {renderDimension(t("sku.form.length"), length, setLength)}
            {renderDimension(t("sku.form.width"), width, setWidth)}
            {renderDimension(t("sku.form.height"), height, setHeight)}
          </View>
          <FieldError message={fieldError("dimensions")} />
          <View className="flex-row items-center gap-2 rounded-xl border border-brand/20 bg-brand-bg px-3 py-2 dark:bg-brand/10">
            <Box size={15} color="#0B927E" />
            <Text className="text-xs text-brand">
              {t("sku.form.autoVolume")}{" "}
              <Text className="text-xs font-extrabold text-brand">
                {formatSkuVolume(volume) ?? "—"}
              </Text>
            </Text>
          </View>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.weight")}</FieldLabel>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="kg"
            placeholderTextColor="#94A3B8"
            className={inputClass}
          />
          <FieldError message={fieldError("weightKg")} />
          <Text variant="muted" className="text-[11px]">
            {t("sku.form.sizeHint")}
          </Text>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("sku.form.description")}</FieldLabel>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={1000}
            placeholder={t("sku.form.descriptionPlaceholder")}
            placeholderTextColor="#94A3B8"
            className={cn(inputClass, "min-h-[72px]")}
            style={{ textAlignVertical: "top" }}
          />
        </View>

        <View className="flex-row items-center justify-between rounded-2xl border border-neutral-border bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("sku.form.active")}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {t("sku.form.activeHint")}
            </Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ true: "#0B927E", false: "#CBD5E1" }}
          />
        </View>

        <FieldError message={fieldError("form")} />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row gap-2.5 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={onCancel}
          disabled={submitting}
          className="flex-1 items-center rounded-xl border border-neutral-border py-3 active:opacity-70 dark:border-neutral-700"
        >
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-200">
            {t("common.cancel")}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className={cn(
            "flex-[2] items-center rounded-xl bg-cta py-3 active:opacity-80",
            submitting && "opacity-60"
          )}
        >
          <Text className="text-sm font-bold text-white">
            {submitting ? t("common.loading") : submitLabel}
          </Text>
        </Pressable>
      </View>

      <BottomSheet
        visible={scanning}
        onClose={() => setScanning(false)}
        title={t("sku.scan.title")}
        subtitle={t("sku.scan.hint")}
      >
        <BarcodeScannerView
          onClose={() => setScanning(false)}
          onScanned={(code) => {
            setScanning(false);
            setBarcode(code);
            void checkBarcode(code);
          }}
        />
      </BottomSheet>
    </View>
  );
}
