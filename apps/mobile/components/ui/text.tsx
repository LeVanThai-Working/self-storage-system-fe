import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      default: "text-base",
      heading1: "text-4xl font-extrabold tracking-tight text-neutral-dark",
      heading2: "text-3xl font-bold tracking-tight text-neutral-dark",
      heading3: "text-2xl font-semibold text-neutral-dark",
      heading4: "text-xl font-semibold text-neutral-dark",
      title: "text-lg font-semibold text-neutral-dark",
      body: "text-base text-neutral-main",
      bodySmall: "text-sm text-neutral-main",
      caption: "text-xs text-neutral-muted",
      label: "text-sm font-medium text-neutral-main",
      muted: "text-sm text-neutral-muted",
      error: "text-sm text-destructive",
      link: "text-base text-primary underline-offset-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type TextProps = RNTextProps &
  VariantProps<typeof textVariants> & {
    className?: string;
  };

function Text({ className, variant, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}

export { Text, textVariants };
export type { TextProps };
