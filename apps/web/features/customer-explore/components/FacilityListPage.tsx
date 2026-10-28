"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFacilityPriceRanges, usePublicFacilities } from "../hooks";
import { FacilityCard } from "./FacilityCard";

const PAGE_SIZE = 9;

export function FacilityListPage() {
  const t = useTranslations("explore");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = usePublicFacilities({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const priceRanges = useFacilityPriceRanges();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const pagination = data?.pagination;

  return (
    <>
      <h1 className="text-3xl font-bold">{t("list.title")}</h1>
      <p className="mt-2 text-neutral-muted">{t("list.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 flex max-w-xl gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("list.searchPlaceholder")}
          aria-label={t("list.searchPlaceholder")}
        />
        <Button type="submit">
          <Search /> {t("list.searchButton")}
        </Button>
      </form>

      <section className="mt-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-neutral-border bg-white p-8 text-center">
            <p className="text-neutral-muted">{t("list.error")}</p>
            <Button className="mt-4" onClick={() => refetch()}>
              {t("retry")}
            </Button>
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                priceRange={priceRanges.get(facility.id)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-neutral-border bg-white p-8 text-center text-neutral-muted">
            {t("list.empty")}
          </p>
        )}
      </section>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("prev")}
          </Button>
          <span className="text-sm text-neutral-muted">
            {t("pageOf", { page: pagination.page, total: pagination.totalPages })}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </>
  );
}
