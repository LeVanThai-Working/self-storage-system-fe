"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Info, Loader2, Siren, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  InventoryItemStatusEnum,
  RackStatusEnum,
  RackZoneEnum,
  type StorageRackResponse,
  type TreeTierItem,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppApiError } from "@/lib/api/axios";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useStockAdjust,
  useStockMove,
  useUnitInventoryTree,
  useUnitRacks,
  useUpdateInventoryStatus,
} from "../hooks";
import { ItemStatusBadge } from "./StatusBadges";
import { RackIncidentDialog } from "./RackIncidentDialog";
import { TierSelect, type TierSelectValue } from "./TierSelect";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";
const MOVE_REASON_MIN = 5;

const ZONE_BORDER: Record<RackZoneEnum, string> = {
  [RackZoneEnum.PRIME]: "border-amber-400",
  [RackZoneEnum.STANDARD]: "border-teal-500",
  [RackZoneEnum.ECONOMY]: "border-slate-400",
};

type Action = "move" | "adjust" | "status";

interface SelectedItem {
  item: TreeTierItem;
  rack: StorageRackResponse;
  tierId: string;
  tierNumber: number;
}

const tierLabel = (tierNumber: number) => `T${String(tierNumber).padStart(2, "0")}`;

/** S4 — goods tab of a rack unit: rack grid, tiers with items and the staff operations panel. */
export function UnitInventoryView({ unitId }: { unitId: string }) {
  const t = useTranslations("inventoryOps.unit");
  const getErrorMessage = useApiErrorMessage();
  const racksQuery = useUnitRacks(unitId);
  const treeQuery = useUnitInventoryTree(unitId);
  const moveMutation = useStockMove();
  const adjustMutation = useStockAdjust();
  const statusMutation = useUpdateInventoryStatus();

  const racks = useMemo(() => racksQuery.data ?? [], [racksQuery.data]);
  const tree = treeQuery.data;
  const treeForbidden =
    treeQuery.error instanceof AppApiError && treeQuery.error.statusCode === 403;

  const itemsByTier = useMemo(() => {
    const map = new Map<string, TreeTierItem[]>();
    tree?.racks.forEach((rack) => rack.tiers.forEach((tier) => map.set(tier.id, tier.items)));
    return map;
  }, [tree]);

  const aisles = useMemo(() => {
    const groups = new Map<string, StorageRackResponse[]>();
    [...racks]
      .sort((a, b) => (a.bay ?? 0) - (b.bay ?? 0) || a.rackCode.localeCompare(b.rackCode))
      .forEach((rack) => {
        const key = rack.aisle ?? "—";
        groups.set(key, [...(groups.get(key) ?? []), rack]);
      });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [racks]);

  const [rackId, setRackId] = useState<string | null>(null);
  const rack = racks.find((item) => item.id === rackId) ?? null;
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [action, setAction] = useState<Action>("move");
  const [incidentRack, setIncidentRack] = useState<StorageRackResponse | null>(null);

  // Action form state
  const [target, setTarget] = useState<TierSelectValue>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);
  const [newStatus, setNewStatus] = useState<InventoryItemStatusEnum>(
    InventoryItemStatusEnum.NORMAL
  );
  const [incidentId, setIncidentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectItem = (entry: SelectedItem) => {
    setSelected(entry);
    setTarget(null);
    setQuantity(entry.item.quantity);
    setNewQuantity(entry.item.quantity);
    setNewStatus(entry.item.status ?? InventoryItemStatusEnum.NORMAL);
    setReason("");
    setTicketCode("");
    setIncidentId("");
    setError(null);
  };

  const contractId = tree?.contract?.id;

  const handleSubmit = async () => {
    if (!selected) return;
    setError(null);
    const fullReason = [ticketCode.trim() && `[${ticketCode.trim()}]`, reason.trim()]
      .filter(Boolean)
      .join(" ");
    try {
      if (action === "move") {
        if (!target) return setError(t("pickTarget"));
        if (reason.trim().length < MOVE_REASON_MIN)
          return setError(t("reasonMin", { min: MOVE_REASON_MIN }));
        if (!contractId) return setError(t("noContract"));
        await moveMutation.mutateAsync({
          contractId,
          skuId: selected.item.sku.id,
          quantity,
          fromRackTierId: selected.tierId,
          toRackTierId: target === "holding" ? null : target.rackTierId,
          reason: fullReason,
        });
        toast.success(t("moved"));
      } else if (action === "adjust") {
        if (reason.trim().length < MOVE_REASON_MIN)
          return setError(t("reasonMin", { min: MOVE_REASON_MIN }));
        if (!contractId) return setError(t("noContract"));
        await adjustMutation.mutateAsync({
          contractId,
          skuId: selected.item.sku.id,
          rackTierId: selected.tierId,
          newQuantity,
          reason: fullReason,
        });
        toast.success(t("adjusted"));
      } else {
        if (reason.trim().length < MOVE_REASON_MIN)
          return setError(t("reasonMin", { min: MOVE_REASON_MIN }));
        // BE requires the incident behind a `damaged` mark (G12).
        if (
          newStatus === InventoryItemStatusEnum.DAMAGED &&
          !/^[0-9a-fA-F]{24}$/.test(incidentId.trim())
        )
          return setError(t("incidentRequired"));
        await statusMutation.mutateAsync({
          id: selected.item.inventoryId,
          status: newStatus,
          reason: fullReason,
          incidentId: /^[0-9a-fA-F]{24}$/.test(incidentId.trim()) ? incidentId.trim() : undefined,
        });
        toast.success(t("statusUpdated"));
      }
      setSelected(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const pending = moveMutation.isPending || adjustMutation.isPending || statusMutation.isPending;

  const renderRackTile = (item: StorageRackResponse) => {
    const maintenance = item.status === RackStatusEnum.MAINTENANCE;
    const inactive = item.status === RackStatusEnum.INACTIVE;
    const rented = Boolean(item.currentContractId) || item.status === RackStatusEnum.RENTED;
    const used = (item.tiers ?? []).filter(
      (tier) => (itemsByTier.get(tier.id)?.length ?? 0) > 0
    ).length;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setRackId(item.id);
          setSelected(null);
        }}
        className={`flex h-16 w-14 flex-col items-center justify-center gap-0.5 rounded-lg border-2 text-[11px] font-bold transition ${
          item.zone ? ZONE_BORDER[item.zone] : "border-slate-300"
        } ${
          maintenance
            ? "bg-[repeating-linear-gradient(130deg,#fff3e7_0_5px,#ffbd85_5px_8px)] text-orange-700"
            : inactive
              ? "bg-slate-100 text-slate-400"
              : rented
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600"
        } ${rackId === item.id ? "ring-2 ring-teal-400 ring-offset-2" : ""}`}
      >
        {maintenance ? <Wrench className="h-3.5 w-3.5" /> : null}
        <span>{item.rackCode}</span>
        <span className="text-[9px] font-semibold opacity-80">
          {used}/{item.tierCount}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        {tree?.contract
          ? t("subtitleContract", { code: tree.contract.contractCode })
          : t("subtitle")}
      </p>

      {treeForbidden ? (
        <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t("treeForbidden")}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_380px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 rounded-b-[40%] bg-gradient-to-b from-slate-100 to-slate-200 py-2 text-center text-[10px] font-bold tracking-wider text-slate-500">
            {t("entrance")}
          </div>
          {racksQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : racksQuery.isError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
              {getErrorMessage(racksQuery.error)}
            </p>
          ) : racks.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t("noRacks")}</p>
          ) : (
            <div className="space-y-4">
              {aisles.map(([aisle, aisleRacks]) => (
                <div key={aisle}>
                  <p className="mb-1.5 text-xs font-bold text-slate-500">
                    {t("aisle", { aisle })}
                    {aisleRacks[0]?.zone ? ` · ${aisleRacks[0].zone}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">{aisleRacks.map(renderRackTile)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded bg-teal-600" />
              {t("legend.rented")}
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded border border-slate-300 bg-white" />
              {t("legend.free")}
            </span>
            <span className="flex items-center gap-1">
              <i className="h-3 w-3 rounded bg-orange-300" />
              {t("legend.maintenance")}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {rack ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-base font-extrabold text-slate-900">
                    {t("rackTitle", { rack: rack.rackCode })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {[rack.zone, t("tiers", { count: rack.tierCount })].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIncidentRack(rack)}>
                  <Siren className="h-3.5 w-3.5 text-orange-600" />
                  {t("rackIncident")}
                </Button>
              </div>
              <div className="space-y-2 border-x-[6px] border-slate-300 px-2">
                {[...(rack.tiers ?? [])]
                  .sort((a, b) => b.tierNumber - a.tierNumber)
                  .map((tier) => {
                    const items = itemsByTier.get(tier.id) ?? [];
                    return (
                      <div key={tier.id} className="border-b-[6px] border-amber-700/50 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {tierLabel(tier.tierNumber)}
                          </span>
                          <div className="flex min-h-[44px] flex-1 flex-wrap items-end gap-1.5">
                            {items.length === 0 ? (
                              <span className="text-xs text-slate-400">{t("emptyTier")}</span>
                            ) : (
                              items.map((item) => {
                                const active = selected?.item.inventoryId === item.inventoryId;
                                return (
                                  <button
                                    key={item.inventoryId}
                                    type="button"
                                    onClick={() =>
                                      selectItem({
                                        item,
                                        rack,
                                        tierId: tier.id,
                                        tierNumber: tier.tierNumber,
                                      })
                                    }
                                    className={`rounded-md border px-2 py-1 text-left text-[11px] ${
                                      active
                                        ? "border-teal-500 bg-teal-50"
                                        : "border-sky-200 bg-sky-50"
                                    } ${item.status === InventoryItemStatusEnum.DISPUTED ? "opacity-60" : ""}`}
                                  >
                                    <span className="block font-mono font-bold">
                                      {item.sku.skuCode}
                                    </span>
                                    <span className="text-slate-500">×{item.quantity}</span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">{t("pickRack")}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-base font-extrabold text-slate-900">
                  {selected.item.sku.skuCode}
                </p>
                <p className="text-xs text-slate-500">
                  {selected.item.sku.name} · {selected.item.quantity} {selected.item.sku.uom} ·{" "}
                  {selected.rack.rackCode} {tierLabel(selected.tierNumber)}
                </p>
                <div className="mt-2">
                  <ItemStatusBadge status={selected.item.status} />
                </div>
              </div>

              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {(["move", "adjust", "status"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAction(value);
                      setError(null);
                    }}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold ${
                      action === value ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {t(`action.${value}`)}
                  </button>
                ))}
              </div>

              {action === "move" ? (
                <>
                  <div>
                    <label className={LABEL}>{t("moveTo")} *</label>
                    <TierSelect
                      racks={racks}
                      value={target}
                      onChange={setTarget}
                      excludeTierId={selected.tierId}
                      allowHolding
                    />
                  </div>
                  <div>
                    <label className={LABEL}>{t("quantity")}</label>
                    <input
                      type="number"
                      min={1}
                      max={selected.item.quantity}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(selected.item.quantity, Number(event.target.value) || 1)
                          )
                        )
                      }
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>{t("ticketCode")}</label>
                    <input
                      value={ticketCode}
                      onChange={(event) => setTicketCode(event.target.value.toUpperCase())}
                      placeholder="SUP-261029-0002"
                      className={INPUT}
                    />
                  </div>
                </>
              ) : action === "adjust" ? (
                <>
                  <div>
                    <label className={LABEL}>{t("countedQuantity")}</label>
                    <input
                      type="number"
                      min={0}
                      value={newQuantity}
                      onChange={(event) =>
                        setNewQuantity(Math.max(0, Number(event.target.value) || 0))
                      }
                      className={INPUT}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {t("systemQuantity", { qty: selected.item.quantity })}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={LABEL}>{t("newStatus")}</label>
                    <select
                      value={newStatus}
                      onChange={(event) =>
                        setNewStatus(event.target.value as InventoryItemStatusEnum)
                      }
                      className={INPUT}
                    >
                      {Object.values(InventoryItemStatusEnum).map((value) => (
                        <option key={value} value={value}>
                          {t(`itemStatus.${value}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>{t("incidentId")}</label>
                    <input
                      value={incidentId}
                      onChange={(event) => setIncidentId(event.target.value)}
                      placeholder={t("incidentIdPlaceholder")}
                      className={INPUT}
                    />
                  </div>
                </>
              )}

              <div>
                <label className={LABEL}>{t("reason")} *</label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  className={INPUT}
                />
                <p className="mt-1 text-xs text-slate-500">{t("notifyHint")}</p>
              </div>

              {error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <Button
                onClick={() => void handleSubmit()}
                disabled={pending}
                className="w-full bg-orange-500 text-white hover:bg-orange-600"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t(`submit.${action}`)}
              </Button>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">{t("pickItem")}</p>
          )}
        </div>
      </div>

      {incidentRack ? (
        <RackIncidentDialog
          open
          onClose={() => setIncidentRack(null)}
          fromRack={incidentRack}
          racks={racks}
        />
      ) : null}
    </div>
  );
}
