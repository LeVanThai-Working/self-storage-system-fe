import { setRequestLocale } from "next-intl/server";
import { ReservationFormPage } from "@/features/customer-reservation/components/ReservationFormPage";

export default async function NewReservationRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ facilityId?: string; unitTypeId?: string }>;
}) {
  const { locale } = await params;
  const { facilityId, unitTypeId } = await searchParams;
  setRequestLocale(locale);

  return <ReservationFormPage facilityId={facilityId} unitTypeId={unitTypeId} />;
}
