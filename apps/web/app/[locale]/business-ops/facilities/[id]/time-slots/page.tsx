"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BusinessOpsLayout } from "@/features/business-ops/components/BusinessOpsLayout";
import { FacilityTimeSlotsManager } from "@/features/facility-time-slot";

export default function FacilityTimeSlotsSubPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);

  return (
    <BusinessOpsLayout>
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/business-ops/facilities`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại danh sách cơ sở
          </Link>
        </div>
        <FacilityTimeSlotsManager initialFacilityId={id} />
      </div>
    </BusinessOpsLayout>
  );
}
