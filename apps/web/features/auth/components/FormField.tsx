"use client";

import * as React from "react";
import { CircleAlert, CircleCheck, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  leftIcon,
  rightSlot,
  className,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-neutral-main text-[13px] font-semibold">
        {label}
      </Label>
      <div className="relative">
        {leftIcon && (
          <span className="text-neutral-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 [&_svg]:size-4">
            {leftIcon}
          </span>
        )}
        <Input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 rounded-xl bg-white px-3.5 text-sm",
            leftIcon && "pl-10",
            rightSlot && "pr-11",
            className
          )}
          {...props}
        />
        {rightSlot && (
          <span className="text-neutral-muted absolute top-1/2 right-3 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordFieldProps extends Omit<FormFieldProps, "type" | "rightSlot"> {
  showLabel: string;
  hideLabel: string;
}

export function PasswordField({ showLabel, hideLabel, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <FormField
      type={visible ? "text" : "password"}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="hover:text-neutral-main flex cursor-pointer items-center rounded p-1 focus-visible:outline-2"
          aria-label={visible ? hideLabel : showLabel}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
}

interface FormAlertProps {
  variant: "error" | "success";
  message: string;
}

export function FormAlert({ variant, message }: FormAlertProps) {
  const Icon = variant === "error" ? CircleAlert : CircleCheck;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl border p-3 text-xs",
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      <Icon className="mt-px size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
