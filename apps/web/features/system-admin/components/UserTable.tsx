"use client";

import React, { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useUser, useDeleteUser } from "../hooks";
import { USER_ROLE } from "@self-storage-system-fe/shared";
import { Edit2, Lock, Unlock, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const getRoleBadge = (role: USER_ROLE | string, t: ReturnType<typeof useTranslations>) => {
  switch (role) {
    case USER_ROLE.SYSTEM_ADMIN:
    case "system_admin":
      return (
        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
          {t("userTable.roles.systemAdmin")}
        </span>
      );
    case USER_ROLE.FACILITY_MANAGER:
    case "facility_manager":
      return (
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          {t("userTable.roles.facilityManager")}
        </span>
      );
    case USER_ROLE.FACILITY_STAFF:
    case "facility_staff":
      return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
          {t("userTable.roles.facilityStaff")}
        </span>
      );
    case USER_ROLE.CUSTOMER:
    case "customer":
      return (
        <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
          {t("userTable.roles.customer")}
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
          {role}
        </span>
      );
  }
};

const EditUserModal = ({
  userId,
  isOpen,
  onClose,
}: {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const t = useTranslations("systemAdmin");
  const { data: user, isLoading } = useUser(userId || "", { enabled: !!userId });
  const updateUser = useUpdateUser();
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    role: "customer",
    status: "active" as "active" | "inactive",
  });

  React.useEffect(() => {
    if (user) {
      // eslint-disable-next-line
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        role: user.role || "customer",
        status: (user.status as "active" | "inactive") || "active",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      await updateUser.mutateAsync({
        id: userId,
        payload: formData,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update user", error);
      alert(t("userTable.editModal.updateFailed"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("userTable.editModal.title")}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-slate-500">{t("userTable.loading")}</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                {t("userTable.editModal.name")}
              </label>
              <input
                required
                type="text"
                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn B"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                {t("userTable.editModal.phone")}
              </label>
              <input
                required
                type="text"
                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0901234567"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                {t("userTable.editModal.role")}
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="customer">{t("userTable.roles.customer")}</option>
                <option value="facility_staff">{t("userTable.roles.facilityStaff")}</option>
                <option value="facility_manager">{t("userTable.roles.facilityManager")}</option>
                <option value="system_admin">{t("userTable.roles.systemAdmin")}</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                {t("userTable.editModal.status")}
              </label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                }
              >
                <option value="active">{t("userTable.status.active")}</option>
                <option value="inactive">{t("userTable.status.inactive")}</option>
              </select>
            </div>
            <DialogFooter className="mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t("userTable.editModal.cancel")}
              </button>
              <button
                type="submit"
                disabled={updateUser.isPending}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {updateUser.isPending
                  ? t("userTable.editModal.saving")
                  : t("userTable.editModal.save")}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const UserTable = () => {
  const t = useTranslations("systemAdmin");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers({ search });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "customer",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    try {
      await createUser.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", phoneNumber: "", role: "customer" });
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      console.error("Failed to create user", error);
      if (err.errors && Array.isArray(err.errors)) {
        const errors: Record<string, string> = {};
        err.errors.forEach((item: unknown) => {
          const e = item as { field?: string; message?: string };
          if (e.field && e.message) {
            errors[e.field] = e.message;
          }
        });
        setFormErrors(errors);
      } else {
        const errorMsg =
          typeof err.message === "string" ? err.message : t("userTable.retryMessage");
        alert(`${t("userTable.createFailed")} ${errorMsg}`);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active";
      await updateUser.mutateAsync({
        id: user.id,
        payload: { status: newStatus },
      });
    } catch (error) {
      console.error("Failed to update status", error);
      alert(t("userTable.updateStatusFailed"));
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch (error) {
      console.error("Failed to delete user", error);
      alert(t("userTable.deleteModal.failed"));
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800 font-sans">{t("userTable.title")}</h1>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2">
            <span>{t("userTable.createAccount")}</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("userTable.createModal.title")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 mt-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("userTable.createModal.name")}
                </label>
                <input
                  required
                  type="text"
                  className={`flex h-9 w-full rounded-md border ${formErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"} bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:ring-1`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
                {formErrors.name && <span className="text-xs text-red-500">{formErrors.name}</span>}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("userTable.createModal.email")}
                </label>
                <input
                  required
                  type="email"
                  className={`flex h-9 w-full rounded-md border ${formErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"} bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:ring-1`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
                {formErrors.email && (
                  <span className="text-xs text-red-500">{formErrors.email}</span>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("userTable.createModal.phone")}
                </label>
                <input
                  required
                  type="text"
                  className={`flex h-9 w-full rounded-md border ${formErrors.phoneNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"} bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:ring-1`}
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0901234567"
                />
                {formErrors.phoneNumber && (
                  <span className="text-xs text-red-500">{formErrors.phoneNumber}</span>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("userTable.createModal.password")}
                </label>
                <input
                  required
                  type="password"
                  className={`flex h-9 w-full rounded-md border ${formErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"} bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:ring-1`}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="********"
                />
                {formErrors.password && (
                  <span className="text-xs text-red-500">{formErrors.password}</span>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">
                  {t("userTable.createModal.role")}
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="customer">{t("userTable.roles.customer")}</option>
                  <option value="facility_staff">{t("userTable.roles.facilityStaff")}</option>
                  <option value="facility_manager">{t("userTable.roles.facilityManager")}</option>
                  <option value="system_admin">{t("userTable.roles.systemAdmin")}</option>
                </select>
              </div>
              <DialogFooter className="mt-4">
                <DialogClose className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  {t("userTable.createModal.cancel")}
                </DialogClose>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {createUser.isPending
                    ? t("userTable.createModal.saving")
                    : t("userTable.createModal.confirm")}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Modal */}
      <EditUserModal
        userId={editingUserId}
        isOpen={!!editingUserId}
        onClose={() => setEditingUserId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("userTable.deleteModal.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-2">
            {t("userTable.deleteModal.message")}{" "}
            <span className="font-semibold text-slate-800">{deletingUser?.name}</span>?{" "}
            {t("userTable.deleteModal.warning")}
          </p>
          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t("userTable.deleteModal.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {deleteUser.isPending
                ? t("userTable.deleteModal.deleting")
                : t("userTable.deleteModal.confirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border-none overflow-hidden">
        {/* Toolbar / Search */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("userTable.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("userTable.columns.user")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("userTable.columns.role")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("userTable.columns.facility")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("userTable.columns.status")}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  {t("userTable.columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t("userTable.loading")}
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {t("userTable.empty")}
                  </td>
                </tr>
              ) : (
                data?.data.map((user) => {
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                            {user.phoneNumber && (
                              <div className="text-xs text-slate-400 mt-0.5">
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role, t)}</td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 text-sm">
                          {user.assignedFacility || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-red-500"}`}
                          ></span>
                          <span
                            className={`text-sm font-medium ${user.status === "active" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {user.status === "active"
                              ? t("userTable.status.active")
                              : t("userTable.status.inactive")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={t("userTable.edit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updateUser.isPending}
                            className={`p-2 transition-colors rounded-lg ${user.status === "active" ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"} disabled:opacity-50`}
                            title={
                              user.status === "active"
                                ? t("userTable.lockAccount")
                                : t("userTable.unlockAccount")
                            }
                          >
                            {user.status === "active" ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeletingUser({ id: user.id, name: user.name })}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t("userTable.deleteAccount")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
