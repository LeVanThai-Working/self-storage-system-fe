"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CloudinaryFolderEnum,
  ContractStatusEnum,
  createInboundRequestSchema,
  type CreateInboundRequest,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { SignaturePad } from "@/components/common/SignaturePad";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useMyFacility } from "@/features/storage-unit-management/hooks";
import { fetchContracts } from "@/features/contract-management/api";
import {
  useCreateCustomerSku,
  useCreateInboundRequest,
  useCustomerSkus,
  useUnitRacks,
} from "../hooks";
import { TierSelect, type TierChoice } from "./TierSelect";
import type { FacilityPortal } from "./RequestQueueView";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const CARD = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";
const MIN_EVIDENCE = 3;

interface ItemRow {
  key: number;
  skuId: string;
  quantity: number;
  tier: TierChoice | null;
}

/** S3 — staff receive goods for a customer: items, carrier, ≥3 photos, optional signature. */
export function InboundCreateView({ portalBase }: { portalBase: FacilityPortal }) {
  const t = useTranslations("inventoryOps.inbound");
  const locale = useLocale();
  const router = useRouter();
  const getErrorMessage = useApiErrorMessage();
  const { data: facility } = useMyFacility();

  const contractsQuery = useQuery({
    queryKey: ["inventory-ops", "active-contracts", facility?.id],
    queryFn: () =>
      fetchContracts({ facilityId: facility!.id, status: ContractStatusEnum.ACTIVE, limit: 100 }),
    enabled: Boolean(facility?.id),
  });
  const contracts = contractsQuery.data?.items ?? [];

  const [contractId, setContractId] = useState("");
  const contract = contracts.find((item) => item.id === contractId);
  const skusQuery = useCustomerSkus(contract?.customerId);
  const racksQuery = useUnitRacks(contract?.storageUnitId);
  const createMutation = useCreateInboundRequest();
  const createSkuMutation = useCreateCustomerSku();

  const [rows, setRows] = useState<ItemRow[]>([{ key: 1, skuId: "", quantity: 1, tier: null }]);
  const [transporter, setTransporter] = useState({ name: "", phone: "", plate: "", company: "" });
  const [evidence, setEvidence] = useState<string[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>();
  const [staffNotes, setStaffNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [skuDialog, setSkuDialog] = useState(false);
  const [newSku, setNewSku] = useState({ skuCode: "", name: "", uom: "cái" });

  const updateRow = (key: number, patch: Partial<ItemRow>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const handleCreateSku = async () => {
    if (!contract) return;
    try {
      const sku = await createSkuMutation.mutateAsync({
        customerId: contract.customerId,
        skuCode: newSku.skuCode.trim().toUpperCase(),
        name: newSku.name.trim(),
        uom: newSku.uom.trim() || "cái",
      });
      toast.success(t("skuCreated", { code: sku.skuCode }));
      setSkuDialog(false);
      setNewSku({ skuCode: "", name: "", uom: "cái" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const payload: CreateInboundRequest = {
      contractId,
      items: rows
        .filter((row) => row.skuId)
        .map((row) => ({
          skuId: row.skuId,
          quantity: row.quantity,
          storageRackId: row.tier?.storageRackId,
          rackTierId: row.tier?.rackTierId,
        })),
      transporterInfo: {
        name: transporter.name.trim(),
        phoneNumber: transporter.phone.trim(),
        vehiclePlate: transporter.plate.trim() || undefined,
        deliveryCompany: transporter.company.trim() || undefined,
      },
      evidenceImages: evidence,
      signatureUrl,
      staffNotes: staffNotes.trim() || undefined,
    };
    const parsed = createInboundRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === "evidenceImages"
          ? t("evidenceMin", { min: MIN_EVIDENCE })
          : field === "transporterInfo"
            ? t("transporterRequired")
            : field === "contractId"
              ? t("contractRequired")
              : t("itemsRequired")
      );
      return;
    }
    try {
      const request = await createMutation.mutateAsync(payload);
      toast.success(t("created", { code: request.requestCode }));
      router.push(`/${locale}/${portalBase}/inventory-requests/${request.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/${locale}/${portalBase}/inventory-requests`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className={CARD}>
            <label className={LABEL}>{t("contract")} *</label>
            <select
              value={contractId}
              onChange={(event) => {
                setContractId(event.target.value);
                setRows([{ key: Date.now(), skuId: "", quantity: 1, tier: null }]);
              }}
              className={INPUT}
            >
              <option value="">{t("contractPlaceholder")}</option>
              {contracts.map((item) => (
                <option key={item.id} value={item.id}>
                  {[item.contractCode, item.customer?.name, item.storageUnit?.unitNumber]
                    .filter(Boolean)
                    .join(" · ")}
                </option>
              ))}
            </select>
          </div>

          <div className={CARD}>
            <div className="mb-3 flex items-center justify-between">
              <p className={LABEL}>{t("items")}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={!contract}
                onClick={() => setSkuDialog(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("newSku")}
              </Button>
            </div>
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-[1.4fr_90px_1fr_32px] items-center gap-2"
                >
                  <select
                    value={row.skuId}
                    disabled={!contract}
                    onChange={(event) => updateRow(row.key, { skuId: event.target.value })}
                    className={INPUT}
                  >
                    <option value="">{t("skuPlaceholder")}</option>
                    {(skusQuery.data?.items ?? []).map((sku) => (
                      <option key={sku.id} value={sku.id}>
                        {sku.skuCode} · {sku.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.key, { quantity: Math.max(1, Number(event.target.value) || 1) })
                    }
                    className={INPUT}
                  />
                  <TierSelect
                    racks={racksQuery.data ?? []}
                    value={row.tier}
                    disabled={!contract}
                    onChange={(choice) =>
                      updateRow(row.key, { tier: choice && choice !== "holding" ? choice : null })
                    }
                  />
                  <button
                    type="button"
                    disabled={rows.length === 1}
                    onClick={() => setRows((prev) => prev.filter((item) => item.key !== row.key))}
                    className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-teal-700"
              disabled={!contract}
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  { key: Date.now(), skuId: "", quantity: 1, tier: null },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              {t("addRow")}
            </Button>
            <p className="mt-2 text-xs text-slate-500">{t("tierHint")}</p>
          </div>

          <div className={CARD}>
            <CloudinaryUploader
              value={evidence}
              onChange={setEvidence}
              folder={CloudinaryFolderEnum.INVENTORY_REQUESTS}
              multiple
              maxFiles={6}
              accept="image/*"
              label={`${t("evidence")} *`}
              description={t("evidenceHint", { min: MIN_EVIDENCE })}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className={`${CARD} space-y-3`}>
            <p className={LABEL}>{t("transporter")} *</p>
            {(
              [
                ["name", t("transporterName")],
                ["phone", t("transporterPhone")],
                ["plate", t("transporterPlate")],
                ["company", t("transporterCompany")],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                value={transporter[key]}
                onChange={(event) =>
                  setTransporter((prev) => ({ ...prev, [key]: event.target.value }))
                }
                placeholder={label}
                className={INPUT}
              />
            ))}
          </div>
          <div className={`${CARD} space-y-3`}>
            <SignaturePad
              value={signatureUrl}
              onChange={setSignatureUrl}
              label={t("signature")}
              clearLabel={t("signatureClear")}
              hint={t("signatureHint")}
            />
            <textarea
              value={staffNotes}
              onChange={(event) => setStaffNotes(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder={t("staffNotes")}
              className={INPUT}
            />
          </div>
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <Button
            onClick={() => void handleSubmit()}
            disabled={createMutation.isPending}
            className="w-full bg-orange-500 text-white hover:bg-orange-600"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("submit")}
          </Button>
          <p className="text-xs text-slate-500">{t("customerConfirmHint")}</p>
        </div>
      </div>

      <Dialog open={skuDialog} onOpenChange={setSkuDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("newSkuTitle", { customer: contract?.customer?.name ?? "" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={newSku.skuCode}
              onChange={(event) =>
                setNewSku((prev) => ({ ...prev, skuCode: event.target.value.toUpperCase() }))
              }
              placeholder={t("newSkuCode")}
              className={INPUT}
            />
            <input
              value={newSku.name}
              onChange={(event) => setNewSku((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t("newSkuName")}
              className={INPUT}
            />
            <input
              value={newSku.uom}
              onChange={(event) => setNewSku((prev) => ({ ...prev, uom: event.target.value }))}
              placeholder={t("newSkuUom")}
              className={INPUT}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkuDialog(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void handleCreateSku()}
              disabled={
                !newSku.skuCode.trim() || !newSku.name.trim() || createSkuMutation.isPending
              }
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {t("newSkuSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
