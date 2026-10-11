"use client";

import { useTranslations } from "next-intl";
import { Boxes, Sparkles } from "lucide-react";
import { useFacilityOfferings } from "@/features/storage-unit-management/hooks";
import { useFacilityAmenityOfferings } from "../hooks";

interface CatalogViewProps {
  facilityId: string | undefined;
}

/** Tra cứu nhanh loại kho và tiện ích mà cơ sở hiện đang mở bán. */
export const CatalogView = ({ facilityId }: CatalogViewProps) => {
  const t = useTranslations("facilityManager.requests.catalog");
  const { data: offerings, isLoading: loadingOfferings } = useFacilityOfferings(facilityId);
  const { data: amenityOfferings, isLoading: loadingAmenities } =
    useFacilityAmenityOfferings(facilityId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Unit types đang mở bán */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Boxes className="w-4 h-4 text-emerald-600" />
          {t("unitTypesTitle")}
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {loadingOfferings ? (
            <div className="p-4 text-xs text-slate-400">{t("loading")}</div>
          ) : !offerings || offerings.length === 0 ? (
            <div className="p-4 text-xs text-slate-400">{t("emptyUnitTypes")}</div>
          ) : (
            offerings.map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{o.unitType.name}</span>
                <span className="text-xs text-slate-500">
                  {o.pricePerUnit.toLocaleString("vi-VN")}đ/{t(`billingUnit.${o.billingUnit}`)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Amenities đang mở bán */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          {t("amenitiesTitle")}
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {loadingAmenities ? (
            <div className="p-4 text-xs text-slate-400">{t("loading")}</div>
          ) : !amenityOfferings || amenityOfferings.length === 0 ? (
            <div className="p-4 text-xs text-slate-400">{t("emptyAmenities")}</div>
          ) : (
            amenityOfferings.map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">{o.amenity.name}</span>
                  <span className="text-xs text-slate-400 ml-2">
                    {t("available")}: {o.availableQuantity}/{o.totalQuantity}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {o.pricePerUnit.toLocaleString("vi-VN")}đ/{t(`billingUnit.${o.billingUnit}`)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
