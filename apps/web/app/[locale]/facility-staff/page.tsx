import { redirect } from "next/navigation";

export default async function FacilityStaffRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/facility-staff/contracts`);
}
