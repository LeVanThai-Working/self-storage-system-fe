import { UserTable } from "@/features/system-admin/components/UserTable";
import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Người dùng | StorageHub",
  description: "Quản lý người dùng, phân quyền hệ thống.",
};

export default async function UserManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UserTable />;
}
