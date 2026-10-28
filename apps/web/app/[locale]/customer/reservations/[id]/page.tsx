import { setRequestLocale } from "next-intl/server";
import { ReservationDetailPage } from "@/features/customer-reservation/components/ReservationDetailPage";

export default async function ReservationDetailRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ReservationDetailPage id={id} />;
}
