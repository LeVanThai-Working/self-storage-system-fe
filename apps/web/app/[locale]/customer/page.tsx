import { redirect } from "next/navigation";

export default async function CustomerRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/customer/facilities`);
}
