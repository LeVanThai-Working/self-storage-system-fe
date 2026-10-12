import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";

interface FacilityPaginationProps {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (nextPage: number) => void;
}

type PageToken = number | "ellipsis-left" | "ellipsis-right";

export function FacilityPagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: FacilityPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);

  const pageTokens = useMemo<PageToken[]>(() => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const tokens: PageToken[] = [1];

    if (page > 3) {
      tokens.push("ellipsis-left");
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(safeTotalPages - 1, page + 1);

    for (let i = start; i <= end; i += 1) {
      tokens.push(i);
    }

    if (page < safeTotalPages - 2) {
      tokens.push("ellipsis-right");
    }

    tokens.push(safeTotalPages);
    return tokens;
  }, [page, safeTotalPages]);

  const canPrev = hasPrevPage || page > 1;
  const canNext = hasNextPage || page < safeTotalPages;

  return (
    <View className="mt-2 mb-6 flex-row items-center justify-center gap-1.5">
      {/* Previous Page Button (<) */}
      <Pressable
        disabled={!canPrev}
        onPress={() => canPrev && onPageChange(page - 1)}
        className={`h-9 w-9 items-center justify-center rounded-xl border ${
          canPrev
            ? "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900"
            : "border-neutral-border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 opacity-40"
        }`}
      >
        <ChevronLeft size={16} color="#0B927E" />
      </Pressable>

      {/* Numbered Page Buttons (1, 2, ... ) */}
      {pageTokens.map((token) => {
        if (typeof token !== "number") {
          return (
            <View key={token} className="h-9 min-w-[28px] items-center justify-center px-1">
              <Text className="text-xs font-bold text-neutral-muted">...</Text>
            </View>
          );
        }

        const isCurrent = token === page;
        return (
          <Pressable
            key={`page-btn-${token}`}
            onPress={() => {
              if (!isCurrent) onPageChange(token);
            }}
            className={`h-9 min-w-[36px] items-center justify-center rounded-xl border px-2.5 ${
              isCurrent
                ? "border-brand bg-brand"
                : "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isCurrent ? "text-white" : "text-neutral-dark dark:text-neutral-200"
              }`}
            >
              {token}
            </Text>
          </Pressable>
        );
      })}

      {/* Next Page Button (>) */}
      <Pressable
        disabled={!canNext}
        onPress={() => canNext && onPageChange(page + 1)}
        className={`h-9 w-9 items-center justify-center rounded-xl border ${
          canNext
            ? "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900"
            : "border-neutral-border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 opacity-40"
        }`}
      >
        <ChevronRight size={16} color="#0B927E" />
      </Pressable>
    </View>
  );
}
