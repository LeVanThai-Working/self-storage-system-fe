import { TextInput, View, type TextInputProps } from "react-native";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = TextInputProps & {
  containerClassName?: string;
  /** Visual error state */
  error?: boolean;
};

const Input = forwardRef<TextInput, InputProps>(
  ({ className, containerClassName, error, ...props }, ref) => {
    return (
      <View className={cn("relative", containerClassName)}>
        <TextInput
          ref={ref}
          className={cn(
            "h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground",
            "placeholder:text-neutral-muted",
            "focus:border-ring focus:outline-none",
            "disabled:opacity-50",
            error && "border-destructive",
            className
          )}
          placeholderTextColor="#647B80"
          {...props}
        />
      </View>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
