import { setRequestLocale } from "next-intl/server";
import { FacilityListPage } from "@/features/customer-explore/components/FacilityListPage";

export default async function FacilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FacilityListPage />;
}
