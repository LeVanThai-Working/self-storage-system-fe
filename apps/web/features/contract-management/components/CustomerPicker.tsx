"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, UserRound, X } from "lucide-react";
import { RoleEnum } from "@self-storage-system-fe/shared";
import api from "@/lib/api/axios";
import { useDebouncedValue } from "@/features/storage-unit-management/hooks";

interface CustomerOption {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
}

const searchCustomers = async (search: string): Promise<CustomerOption[]> => {
  const { data } = await api.get("/users/search", {
    params: { search, role: RoleEnum.CUSTOMER, page: 1, limit: 8 },
  });
  return data.data?.items ?? [];
};

interface CustomerPickerProps {
  value: CustomerOption | null;
  onChange: (customer: CustomerOption | null) => void;
  isEn: boolean;
}

/** Search a customer by name, phone or email instead of typing a raw account ID. */
export function CustomerPicker({ value, onChange, isEn }: CustomerPickerProps) {
  const [input, setInput] = useState("");
  const search = useDebouncedValue(input.trim());

  const resultsQuery = useQuery({
    queryKey: ["customer-picker", search],
    queryFn: () => searchCustomers(search),
    enabled: search.length >= 2 && !value,
  });

  if (value) {
    return (
      <div className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-200 px-3.5 py-2 rounded-xl">
        <UserRound className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-emerald-900 truncate">{value.name}</p>
          <p className="text-[11px] text-emerald-700/80 truncate">
            {[value.phoneNumber, value.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={isEn ? "Change customer" : "Đổi khách hàng"}
          className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const results = resultsQuery.data ?? [];
  const showList = search.length >= 2;

  return (
    <div className="relative">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isEn ? "Name, phone or email" : "Tên, số điện thoại hoặc email"}
        className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
      />
      {showList && (
        <div className="absolute z-20 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {resultsQuery.isFetching ? (
            <div className="flex items-center gap-2 px-3.5 py-3 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {isEn ? "Searching..." : "Đang tìm..."}
            </div>
          ) : results.length === 0 ? (
            <p className="px-3.5 py-3 text-xs text-slate-500">
              {isEn ? "No customer found" : "Không tìm thấy khách hàng"}
            </p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setInput("");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 border-b border-slate-50 last:border-0"
              >
                <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {[c.phoneNumber, c.email].filter(Boolean).join(" · ")}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
