import React, { useState } from "react";
import { Image, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import {
  customerAcknowledgeIncidentSchema,
  getIncidentActions,
  type IncidentResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { resolveRequestError } from "@/lib/apiError";
import { useAcknowledgeIncident } from "../hooks/useIncidents";

export function IncidentAcceptance({ incident }: { incident: IncidentResponse }) {
  const { t, locale } = useTranslation();
  const mutation = useAcknowledgeIncident(incident.id);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const actions = getIncidentActions(incident);
  const manifest = incident.preEvacuationManifest;
  const label = (key: string) => t(`incidentWorkflow.${key}`);
  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error(label("openFailed"));
    }
  };
  const submit = async () => {
    setError(null);
    if (!actions.canAcknowledge || mutation.isPending) return;
    const parsed = customerAcknowledgeIncidentSchema.safeParse({
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) return setError(label("invalidNotes"));
    try {
      await mutation.mutateAsync(parsed.data);
      setOpen(false);
      toast.success(label("acknowledged"));
    } catch (err) {
      setError(resolveRequestError(err, locale === "en" ? "en" : "vi").message);
    }
  };
  if (!manifest && !incident.restorationManifestDocUrl) return null;
  return (
    <View className="gap-3 rounded-3xl border border-neutral-border bg-white p-4 dark:bg-neutral-900">
      <Text className="font-bold">{label("title")}</Text>
      {manifest && (
        <>
          <Text className="font-semibold">{label("evacuationManifest")}</Text>
          <Text className="text-xs">{new Date(manifest.evacuatedAt).toLocaleString(locale)}</Text>
          {manifest.items.map((item, index) => (
            <View
              key={`${item.skuId}-${index}`}
              className="gap-1 border-b border-neutral-border pb-2"
            >
              <Text className="text-sm font-bold">
                {item.skuName ?? item.skuCode ?? item.skuId}
              </Text>
              <Text className="text-xs">
                {label("systemQuantity")}: {item.systemQuantity} · {label("actualQuantity")}:{" "}
                {item.actualQuantity} · {label("discrepancy")}: {item.discrepancy}
              </Text>
              {!!(item.condition || item.notes) && (
                <Text className="text-xs">
                  {[item.condition, item.notes].filter(Boolean).join(" · ")}
                </Text>
              )}
            </View>
          ))}
          <Text className="text-xs">
            {label("totals")}: {manifest.totalSystemQuantity} / {manifest.totalActualQuantity} /{" "}
            {manifest.totalDiscrepancy}
          </Text>
          {!!manifest.notes && <Text className="text-xs">{manifest.notes}</Text>}
          <ScrollView horizontal contentContainerClassName="gap-2">
            {manifest.evidenceImages.map((url) => (
              <Pressable key={url} onPress={() => void openUrl(url)}>
                <Image source={{ uri: url }} className="h-20 w-24 rounded-xl" />
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
      {incident.restorationManifestDocUrl ? (
        <Pressable
          onPress={() => void openUrl(incident.restorationManifestDocUrl!)}
          className="rounded-xl border border-brand p-3"
        >
          <Text className="font-bold text-brand">{label("viewDocument")}</Text>
        </Pressable>
      ) : (
        <Text className="text-xs">{label("missingDocument")}</Text>
      )}
      {manifest && !actions.terminal && !actions.closureStatus && (
        <Text className="text-xs">{label("waitingRepair")}</Text>
      )}
      {incident.restorationUploadedAt && (
        <Text className="text-xs">
          {label("uploadedAt")}: {new Date(incident.restorationUploadedAt).toLocaleString(locale)}
        </Text>
      )}
      {incident.restorationUploadedBy && (
        <Text className="text-xs">
          {typeof incident.restorationUploadedBy === "object"
            ? incident.restorationUploadedBy.name
            : incident.restorationUploadedBy}
        </Text>
      )}
      {incident.customerAcknowledgedAt ? (
        <>
          <Text className="text-sm font-semibold">
            {label("acknowledgedAt")}:{" "}
            {new Date(incident.customerAcknowledgedAt).toLocaleString(locale)}
          </Text>
          <Text className="text-xs">
            {typeof incident.customerAcknowledgedBy === "object"
              ? incident.customerAcknowledgedBy?.name
              : incident.customerAcknowledgedBy}
          </Text>
          {!!incident.customerAcknowledgeNotes && (
            <Text className="text-xs">{incident.customerAcknowledgeNotes}</Text>
          )}
          {!actions.terminal && <Text className="text-xs">{label("waitingManager")}</Text>}
        </>
      ) : (
        actions.canAcknowledge && (
          <Pressable onPress={() => setOpen(true)} className="items-center rounded-xl bg-brand p-3">
            <Text className="font-bold text-white">{label("acknowledge")}</Text>
          </Pressable>
        )
      )}
      <BottomSheet
        visible={open}
        onClose={() => !mutation.isPending && setOpen(false)}
        closeDisabled={mutation.isPending}
        title={label("acknowledge")}
        footer={
          <Pressable
            onPress={() => void submit()}
            disabled={mutation.isPending}
            className="items-center rounded-xl bg-brand p-3"
          >
            <Text className="font-bold text-white">{label("confirm")}</Text>
          </Pressable>
        }
      >
        <Text className="mb-3 text-sm">{label("acknowledgeConfirm")}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          maxLength={1000}
          multiline
          editable={!mutation.isPending}
          placeholder={label("notes")}
          className="min-h-20 rounded-xl border border-neutral-border p-3 text-neutral-dark dark:text-white"
        />
        {error && <Text className="mt-2 text-sm text-red-600">{error}</Text>}
      </BottomSheet>
    </View>
  );
}
