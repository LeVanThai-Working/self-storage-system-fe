import { redirect } from "next/navigation";

export default async function FacilityManagerRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/facility-manager/storage-units`);
}
