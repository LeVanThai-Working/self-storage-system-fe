import React from "react";
import { View, Pressable, TextInput } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { Text } from "@/components/ui/text";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unitLabel?: string;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  unitLabel,
  disabled = false,
}: QuantityStepperProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max === undefined || value < max);

  return (
    <View className="flex-row items-center gap-2.5">
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        className={`h-11 w-11 items-center justify-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 ${
          canDecrease ? "" : "opacity-40"
        }`}
      >
        <Minus size={16} color="#0F172A" />
      </Pressable>

      <View className="flex-1 flex-row items-center justify-between rounded-xl border border-brand/40 bg-brand-light/20 px-3.5 py-2">
        <TextInput
          value={String(value)}
          editable={!disabled}
          onChangeText={(txt) => {
            const digits = txt.replace(/[^0-9]/g, "");
            onChange(digits ? Number(digits) : 0);
          }}
          keyboardType="number-pad"
          className="text-base font-extrabold text-brand py-0 min-w-[48px]"
        />
        {unitLabel ? <Text className="text-xs font-bold text-brand">{unitLabel}</Text> : null}
      </View>

      <Pressable
        onPress={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
        disabled={!canIncrease}
        className={`h-11 w-11 items-center justify-center rounded-xl bg-brand ${
          canIncrease ? "" : "opacity-40"
        }`}
      >
        <Plus size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
