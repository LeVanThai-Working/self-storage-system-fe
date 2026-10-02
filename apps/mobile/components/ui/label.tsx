import { Text, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

type LabelProps = TextProps & {
  /** Marks as required (appends a * ) */
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
};

function Label({ className, required, disabled, error, children, ...props }: LabelProps) {
  return (
    <Text
      className={cn(
        "text-sm font-medium leading-none text-neutral-main",
        disabled && "opacity-50",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required && <Text className="ml-0.5 text-destructive"> *</Text>}
    </Text>
  );
}

export { Label };
export type { LabelProps };
