"use client";

import { useTranslations } from "next-intl";
import {
  RackStatusEnum,
  RackTierStatusEnum,
  type StorageRackResponse,
} from "@self-storage-system-fe/shared";

export interface TierChoice {
  storageRackId: string;
  rackTierId: string;
}

/** `"holding"` = the unit's holding area (items without a tier), only with `allowHolding`. */
export type TierSelectValue = TierChoice | "holding" | null;

interface TierSelectProps {
  racks: StorageRackResponse[];
  value?: TierSelectValue;
  onChange: (value: TierSelectValue) => void;
  /** Tier to leave out (the source tier when moving). */
  excludeTierId?: string | null;
  /** Show a "holding area" option that maps to `null` (moves only). */
  allowHolding?: boolean;
  disabled?: boolean;
}

const unusableRack = (status: RackStatusEnum) =>
  status === RackStatusEnum.MAINTENANCE || status === RackStatusEnum.INACTIVE;
const unusableTier = (status: RackTierStatusEnum) =>
  status === RackTierStatusEnum.MAINTENANCE || status === RackTierStatusEnum.INACTIVE;

/** Single select listing every usable "rack · tier" of a unit (maintenance / inactive hidden). */
export function TierSelect({
  racks,
  value,
  onChange,
  excludeTierId,
  allowHolding,
  disabled,
}: TierSelectProps) {
  const t = useTranslations("inventoryOps.tierSelect");
  const HOLDING = "__holding__";

  const options = [...racks]
    .filter((rack) => !unusableRack(rack.status))
    .sort((a, b) => a.rackCode.localeCompare(b.rackCode))
    .flatMap((rack) =>
      [...(rack.tiers ?? [])]
        .filter((tier) => tier.id !== excludeTierId && !unusableTier(tier.status))
        .sort((a, b) => a.tierNumber - b.tierNumber)
        .map((tier) => ({
          key: `${rack.id}|${tier.id}`,
          label: `${rack.rackCode} · T${String(tier.tierNumber).padStart(2, "0")}${
            tier.maxWeightKg ? ` (${tier.maxWeightKg} kg)` : ""
          }`,
        }))
    );

  const current =
    value === "holding" ? HOLDING : value ? `${value.storageRackId}|${value.rackTierId}` : "";

  return (
    <select
      value={current}
      disabled={disabled}
      onChange={(event) => {
        const raw = event.target.value;
        if (!raw) {
          onChange(null);
          return;
        }
        if (raw === HOLDING) {
          onChange("holding");
          return;
        }
        const [storageRackId, rackTierId] = raw.split("|");
        onChange({ storageRackId, rackTierId });
      }}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60"
    >
      <option value="">{t("placeholder")}</option>
      {allowHolding ? <option value={HOLDING}>{t("holding")}</option> : null}
      {options.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
