import React from "react";
import { Text } from "./text";

interface FieldLabelProps {
  children: React.ReactNode;
}

export function FieldLabel({ children }: FieldLabelProps) {
  return (
    <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{children}</Text>
  );
}

interface FieldErrorProps {
  message?: string | null;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return <Text className="text-xs font-semibold text-red-600 dark:text-red-400">{message}</Text>;
}
