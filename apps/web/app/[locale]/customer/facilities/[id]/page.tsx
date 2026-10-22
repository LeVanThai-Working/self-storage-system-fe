import { setRequestLocale } from "next-intl/server";
import { FacilityDetailPage } from "@/features/customer-explore/components/FacilityDetailPage";

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <FacilityDetailPage id={id} />;
}
