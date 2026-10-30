import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ChevronDown, FileText } from "lucide-react-native";
import { ContractStatusEnum, type ContractResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { useMyContractsInfinite } from "../hooks/useContracts";

/** Contracts a customer can raise tickets or incidents about. */
const PICKABLE_STATUSES = new Set<ContractStatusEnum>([
  ContractStatusEnum.ACTIVE,
  ContractStatusEnum.OVERDUE,
  ContractStatusEnum.COMPLETED,
]);

interface ContractPickerProps {
  value?: string;
  onChange: (contract: ContractResponse) => void;
  disabled?: boolean;
  /** Restrict choices further, e.g. only rented contracts for incident reports. */
  filter?: (contract: ContractResponse) => boolean;
}

export function contractLabel(contract: ContractResponse): string {
  const unit = contract.storageUnit?.unitNumber;
  const facility = contract.facility?.name;
  return [contract.contractCode, unit, facility].filter(Boolean).join(" · ");
}

/** Field + bottom sheet listing the customer's contracts. */
export function ContractPicker({ value, onChange, disabled, filter }: ContractPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const query = useMyContractsInfinite({ filterTab: "ALL", limit: 50 });

  const contracts = useMemo(
    () =>
      query.items.filter(
        (contract) => PICKABLE_STATUSES.has(contract.status) && (!filter || filter(contract))
      ),
    [query.items, filter]
  );
  const selected = contracts.find((contract) => contract.id === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        className={cn(
          "flex-row items-center gap-2 rounded-xl border border-neutral-border bg-white px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900",
          disabled && "opacity-60"
        )}
      >
        <FileText size={15} color="#647B80" />
        <Text
          numberOfLines={1}
          className={cn(
            "flex-1 text-sm",
            selected ? "text-neutral-dark dark:text-neutral-100" : "text-neutral-muted"
          )}
        >
          {selected ? contractLabel(selected) : t("contractPicker.placeholder")}
        </Text>
        {query.isLoading ? <ActivityIndicator size="small" color="#0B927E" /> : null}
        <ChevronDown size={16} color="#647B80" />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={t("contractPicker.title")}>
        {contracts.length === 0 && !query.isLoading ? (
          <Text variant="muted" className="py-4 text-center text-xs">
            {t("contractPicker.empty")}
          </Text>
        ) : (
          contracts.map((contract) => {
            const active = contract.id === value;
            return (
              <Pressable
                key={contract.id}
                onPress={() => {
                  onChange(contract);
                  setOpen(false);
                }}
                className={cn(
                  "gap-0.5 rounded-2xl border p-3 active:opacity-80",
                  active
                    ? "border-brand bg-brand-bg dark:bg-brand/10"
                    : "border-neutral-border dark:border-neutral-800"
                )}
              >
                <Text className="font-mono text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {contract.contractCode}
                </Text>
                <Text variant="muted" className="text-[11px]">
                  {[contract.storageUnit?.unitNumber, contract.facility?.name]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </Pressable>
            );
          })
        )}
        {query.hasNextPage ? (
          <Pressable onPress={() => void query.fetchNextPage()} className="items-center py-2">
            <Text className="text-xs font-bold text-brand">{t("contractPicker.loadMore")}</Text>
          </Pressable>
        ) : null}
        <View />
      </BottomSheet>
    </>
  );
}
