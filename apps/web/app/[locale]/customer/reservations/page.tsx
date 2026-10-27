import { setRequestLocale } from "next-intl/server";
import { MyReservationsPage } from "@/features/customer-reservation/components/MyReservationsPage";

export default async function MyReservationsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MyReservationsPage />;
}
