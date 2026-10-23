import { Pressable, ScrollView } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

export interface FilterChipOption<K extends string> {
  key: K;
  label: string;
}

interface FilterChipsProps<K extends string> {
  options: FilterChipOption<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Cancels the parent's `px-4` so the row scrolls edge to edge (default true). */
  bleed?: boolean;
  className?: string;
}

/** Horizontally scrolling, single-select status chips (e.g. contract / reservation filters). */
function FilterChips<K extends string>({
  options,
  value,
  onChange,
  bleed = true,
  className,
}: FilterChipsProps<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn("grow-0", bleed && "-mx-4", className)}
      contentContainerClassName={cn("items-center gap-2", bleed && "px-4")}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              "h-9 min-w-[64px] items-center justify-center rounded-full border px-4 active:opacity-80",
              active
                ? "border-brand bg-brand"
                : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-800"
            )}
          >
            <Text
              numberOfLines={1}
              className={cn(
                "text-[13px] font-semibold leading-4",
                active ? "text-white" : "text-neutral-600 dark:text-neutral-300"
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export { FilterChips };
export type { FilterChipsProps };
