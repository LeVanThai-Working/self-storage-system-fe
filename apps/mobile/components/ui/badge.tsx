import { Text, type TextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-white",
        outline: "border border-border text-foreground",
        success: "bg-brand-light text-brand-dark",
        warning: "bg-cta-light text-cta-dark",
        info: "bg-blue-100 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = TextProps & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, numberOfLines = 1, ...props }: BadgeProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      className={cn(badgeVariants({ variant }), "shrink-0", className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
