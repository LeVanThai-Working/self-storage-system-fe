import { setRequestLocale } from "next-intl/server";
import { SearchPage } from "@/features/customer-explore/components/SearchPage";

export default async function SearchRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; price?: string }>;
}) {
  const { locale } = await params;
  const { type, price } = await searchParams;
  setRequestLocale(locale);

  return <SearchPage initialType={type} initialPrice={price} />;
}
