import { Pressable, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md active:opacity-90 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary",
        cta: "bg-cta",
        primary: "bg-brand",
        outline: "border border-neutral-border bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        destructive: "bg-destructive",
        link: "bg-transparent",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("text-sm font-medium", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      cta: "text-white",
      primary: "text-white",
      outline: "text-neutral-main",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      destructive: "text-white",
      link: "text-primary underline-offset-4",
    },
    size: {
      default: "text-sm",
      sm: "text-xs",
      lg: "text-base",
      icon: "text-sm",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    label?: string;
    /** Render children directly instead of auto-wrapping in <Text> */
    children?: React.ReactNode;
  };

function Button({ className, variant, size, label, children, ...props }: ButtonProps) {
  return (
    <Pressable className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children ?? <Text className={cn(buttonTextVariants({ variant, size }))}>{label}</Text>}
    </Pressable>
  );
}

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };
