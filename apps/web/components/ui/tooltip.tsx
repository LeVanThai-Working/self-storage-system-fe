"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

function TooltipProvider({
  delay = 120,
  closeDelay = 50,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipPortal({ ...props }: TooltipPrimitive.Portal.Props) {
  return <TooltipPrimitive.Portal data-slot="tooltip-portal" {...props} />;
}

function TooltipContent({
  side = "top",
  sideOffset = 6,
  align = "center",
  className,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "side" | "sideOffset" | "align">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        className="isolate z-50 outline-none"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 max-w-xs overflow-hidden rounded-lg bg-slate-900/95 px-2.5 py-1 text-xs font-medium text-white shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 select-none pointer-events-none",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/**
 * Convenience wrapper for adding tooltips to buttons, icons, or links.
 * Automatically wraps disabled triggers in a span so hover events are not lost.
 */
function ActionTooltip({
  content,
  children,
  side = "top",
  disabled = false,
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
}) {
  if (!content) return children;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          disabled ? <span className="inline-flex cursor-not-allowed">{children}</span> : children
        }
      />
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}

/** Small "i" icon next to a label; holds helper text that used to be printed on screen. */
function InfoTooltip({
  content,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <ActionTooltip content={content} side={side}>
      <span
        className={cn(
          "inline-flex shrink-0 cursor-help align-middle text-slate-400 hover:text-slate-600",
          className
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </span>
    </ActionTooltip>
  );
}

/** Single-line text cut with "..." that shows the full value on hover. */
function TruncatedText({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null;
  return (
    <ActionTooltip content={text}>
      <span className={cn("block truncate", className)}>{text}</span>
    </ActionTooltip>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipPortal,
  ActionTooltip,
  InfoTooltip,
  TruncatedText,
};
