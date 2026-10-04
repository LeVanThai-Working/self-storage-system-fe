import { redirect } from "next/navigation";

export default async function SystemAdminRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/system-admin/users`);
}
