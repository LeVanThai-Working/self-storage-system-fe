"use client";

import React, { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Building2, CreditCard, User, X, Save, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUpdateLegalEntity } from "../hooks";
import {
  updateLegalEntitySchema,
  type LegalEntityItem,
  type UpdateLegalEntityRequest,
} from "../types";

interface EditLegalEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: LegalEntityItem | null;
}

export const EditLegalEntityModal: React.FC<EditLegalEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
}) => {
  const locale = useLocale();
  const isEn = locale === "en";

  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Legal Representative
  const [repName, setRepName] = useState("");
  const [repTitle, setRepTitle] = useState("");
  const [repIdNumber, setRepIdNumber] = useState("");

  // Bank Account
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateMutation = useUpdateLegalEntity();

  useEffect(() => {
    if (entity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompanyName(entity.companyName);
      setTaxCode(entity.taxCode);
      setRegisteredAddress(entity.registeredAddress);
      setPhone(entity.phone || "");
      setEmail(entity.email || "");
      setStatus(entity.status);

      setRepName(entity.legalRepresentative?.name || "");
      setRepTitle(entity.legalRepresentative?.title || "");
      setRepIdNumber(entity.legalRepresentative?.idNumber || "");

      setBankName(entity.bankAccount?.bankName || "");
      setAccountNumber(entity.bankAccount?.accountNumber || "");
      setAccountHolder(entity.bankAccount?.accountHolder || "");
      setErrorMsg(null);
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload: UpdateLegalEntityRequest = {
      companyName: companyName.trim(),
      taxCode: taxCode.trim(),
      registeredAddress: registeredAddress.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      status,
      legalRepresentative: {
        name: repName.trim(),
        title: repTitle.trim(),
        idNumber: repIdNumber.trim() || null,
      },
      bankAccount: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      },
    };

    const parsed = updateLegalEntitySchema.safeParse(payload);
    if (!parsed.success) {
      const errList = Object.values(parsed.error.flatten().fieldErrors).flat();
      const firstError = typeof errList[0] === "string" ? errList[0] : null;
      setErrorMsg(firstError || (isEn ? "Invalid update data." : "Dữ liệu cập nhật không hợp lệ."));
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: entity.id,
        payload: parsed.data,
      });
      toast.success(
        isEn ? "Legal entity updated successfully!" : "Cập nhật pháp nhân doanh nghiệp thành công!"
      );
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        (isEn ? "Failed to update legal entity." : "Không thể cập nhật pháp nhân.");
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {isEn ? "Edit Legal Entity" : "Chỉnh sửa Pháp nhân Doanh nghiệp"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Group 1: General Business Information */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              {isEn ? "Company Information" : "Thông tin doanh nghiệp"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Company Name *" : "Tên doanh nghiệp / Công ty *"}
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Tax Code (MST) *" : "Mã số thuế (MST) *"}
                </label>
                <input
                  type="text"
                  required
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  className="w-full font-mono bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Operational Status" : "Trạng thái hoạt động"}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                >
                  <option value="active">{isEn ? "Active" : "Hoạt động"}</option>
                  <option value="inactive">{isEn ? "Inactive" : "Tạm ngưng"}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Registered Address *" : "Địa chỉ trụ sở chính *"}
                </label>
                <input
                  type="text"
                  required
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Phone Number" : "Số điện thoại liên hệ"}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Official Email" : "Email doanh nghiệp"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Legal Representative */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <User className="w-3.5 h-3.5 text-teal-600" />
              {isEn ? "Legal Representative" : "Người đại diện theo pháp luật"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Full Name *" : "Họ và tên *"}
                </label>
                <input
                  type="text"
                  required
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Title / Position *" : "Chức danh *"}
                </label>
                <input
                  type="text"
                  required
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "ID / Passport No." : "Số CCCD / Hộ chiếu"}
                </label>
                <input
                  type="text"
                  value={repIdNumber}
                  onChange={(e) => setRepIdNumber(e.target.value)}
                  className="w-full font-mono bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Bank Account */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              {isEn ? "Bank Account Details" : "Tài khoản ngân hàng giao dịch"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Bank Name *" : "Ngân hàng thụ hưởng *"}
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Account Number *" : "Số tài khoản (STK) *"}
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full font-mono bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? "Account Holder *" : "Chủ tài khoản *"}
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors"
            >
              {isEn ? "Cancel" : "Hủy"}
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEn ? "Saving..." : "Đang lưu..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEn ? "Save Changes" : "Lưu thay đổi"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
