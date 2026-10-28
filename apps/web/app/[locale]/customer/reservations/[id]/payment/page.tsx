import { setRequestLocale } from "next-intl/server";
import { ReservationPaymentPage } from "@/features/customer-reservation/components/ReservationPaymentPage";

export default async function ReservationPaymentRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ReservationPaymentPage id={id} />;
}
