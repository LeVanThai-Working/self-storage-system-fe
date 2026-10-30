import { useState } from "react";
import type { MessageLocale } from "@self-storage-system-fe/shared";
import { toast } from "@/stores/toast.store";
import { useTranslation } from "@/stores/language.store";
import { SKU_ERROR, isApiErrorCode, resolveSkuError } from "../utils/skuFormat";

export type SkuServerError = { field: "skuCode" | "barcode"; message: string } | null;

/** Maps BE duplicate errors (611 / 612) onto form fields; everything else becomes a toast. */
export function useSkuFormSubmit() {
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const [serverError, setServerError] = useState<SkuServerError>(null);

  const handleError = (error: unknown) => {
    const { message } = resolveSkuError(error, currentLocale);
    if (isApiErrorCode(error, SKU_ERROR.CODE_EXISTS)) {
      setServerError({ field: "skuCode", message });
    } else if (isApiErrorCode(error, SKU_ERROR.BARCODE_EXISTS)) {
      setServerError({ field: "barcode", message });
    } else {
      setServerError(null);
      toast.error(message, t("sku.form.saveFailed"));
    }
  };

  return { serverError, clearServerError: () => setServerError(null), handleError };
}
