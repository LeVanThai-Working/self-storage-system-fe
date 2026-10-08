import { redirect } from "next/navigation";

export default async function BusinessOpsRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/business-ops/facilities`);
}
