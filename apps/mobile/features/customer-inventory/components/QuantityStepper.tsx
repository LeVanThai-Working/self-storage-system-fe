import React from "react";
import { View, Pressable, TextInput } from "react-native";
import { Minus, Plus } from "lucide-react-native";

const SIZE = {
  sm: { box: "h-11", button: "w-11", text: "text-base", icon: 16 },
  lg: { box: "h-14", button: "w-14", text: "text-xl", icon: 20 },
};

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: keyof typeof SIZE;
}

/** Segmented "[ − | value | + ]" quantity input. */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  size = "sm",
}: QuantityStepperProps) {
  const style = SIZE[size];
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max === undefined || value < max);

  return (
    <View
      className={`flex-row overflow-hidden rounded-xl border border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900 ${style.box} ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={!canDecrease}
        className={`${style.button} items-center justify-center border-r border-neutral-border dark:border-neutral-700 ${
          canDecrease ? "active:bg-neutral-100 dark:active:bg-neutral-800" : "opacity-30"
        }`}
      >
        <Minus size={style.icon} color="#647B80" />
      </Pressable>

      <TextInput
        value={String(value)}
        editable={!disabled}
        onChangeText={(txt) => {
          const digits = txt.replace(/[^0-9]/g, "");
          onChange(digits ? Number(digits) : 0);
        }}
        keyboardType="number-pad"
        textAlign="center"
        className={`flex-1 py-0 font-extrabold text-neutral-dark dark:text-neutral-100 ${style.text}`}
      />

      <Pressable
        onPress={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
        disabled={!canIncrease}
        className={`${style.button} items-center justify-center border-l border-neutral-border dark:border-neutral-700 ${
          canIncrease ? "active:bg-neutral-100 dark:active:bg-neutral-800" : "opacity-30"
        }`}
      >
        <Plus size={style.icon} color="#647B80" />
      </Pressable>
    </View>
  );
}
