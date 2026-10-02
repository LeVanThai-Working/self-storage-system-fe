import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

type SeparatorProps = ViewProps & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
};

function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <View
      role="separator"
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
export type { SeparatorProps };
