"use client";

import React, { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useUser, useDeleteUser } from "../hooks";
import { USER_ROLE } from "@self-storage-system-fe/shared";
import { Edit2, Lock, Unlock, Search, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const getRoleBadge = (role: USER_ROLE | string) => {
  switch (role) {
    case USER_ROLE.SYSTEM_ADMIN:
    case "system_admin":
      return (
        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
          Quản trị HT
        </span>
      );
    case USER_ROLE.FACILITY_MANAGER:
    case "facility_manager":
      return (
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          Quản lý cơ sở
        </span>
      );
    case USER_ROLE.FACILITY_STAFF:
    case "facility_staff":
      return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
          Nhân viên
        </span>
      );
    case USER_ROLE.CUSTOMER:
    case "customer":
      return (
        <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
          Khách hàng
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
      alert("Cập nhật thất bại!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Tên người dùng *</label>
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
              <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
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
              <label className="text-sm font-medium text-slate-700">Vai trò *</label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="customer">Khách hàng</option>
                <option value="facility_staff">Nhân viên cơ sở</option>
                <option value="facility_manager">Quản lý cơ sở</option>
                <option value="system_admin">Quản trị hệ thống</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Trạng thái</label>
              <select
                className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                }
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Đã khóa</option>
              </select>
            </div>
            <DialogFooter className="mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updateUser.isPending}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {updateUser.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const UserTable = () => {
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
        const errorMsg = typeof err.message === "string" ? err.message : "Vui lòng thử lại!";
        alert(`Tạo người dùng thất bại. ${errorMsg}`);
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
      alert("Cập nhật trạng thái thất bại!");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Xóa người dùng thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800 font-sans">Quản lý Người dùng</h1>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2">
            <span>+ Tạo tài khoản mới</span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 mt-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Tên người dùng *</label>
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
                <label className="text-sm font-medium text-slate-700">Email *</label>
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
                <label className="text-sm font-medium text-slate-700">Số điện thoại *</label>
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
                <label className="text-sm font-medium text-slate-700">Mật khẩu *</label>
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
                <label className="text-sm font-medium text-slate-700">Vai trò *</label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="customer">Khách hàng</option>
                  <option value="facility_staff">Nhân viên cơ sở</option>
                  <option value="facility_manager">Quản lý cơ sở</option>
                  <option value="system_admin">Quản trị hệ thống</option>
                </select>
              </div>
              <DialogFooter className="mt-4">
                <DialogClose className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Hủy
                </DialogClose>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {createUser.isPending ? "Đang lưu..." : "Xác nhận tạo"}
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
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-2">
            Bạn có chắc chắn muốn xóa tài khoản{" "}
            <span className="font-semibold text-slate-800">{deletingUser?.name}</span>? Hành động
            này không thể hoàn tác.
          </p>
          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {deleteUser.isPending ? "Đang xóa..." : "Xóa tài khoản"}
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
              placeholder="Tìm kiếm người dùng..."
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
                  Người dùng
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cơ sở được gán
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                data?.data.map((user) => {
                  console.log("User data:", user);
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
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
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
                            {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updateUser.isPending}
                            className={`p-2 transition-colors rounded-lg ${user.status === "active" ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"} disabled:opacity-50`}
                            title={
                              user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"
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
                            title="Xóa tài khoản"
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
