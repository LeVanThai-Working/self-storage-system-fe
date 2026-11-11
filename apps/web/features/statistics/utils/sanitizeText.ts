const VIETNAMESE_DIACRITICS_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/**
 * Normalizes Vietnamese text by translating raw English enum statuses,
 * removing redundant English terms in parentheses, and eliminating mixed English-Vietnamese.
 */
export function sanitizeVietnameseText(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Remove raw technical chunk tags like [CHUNK-OVERVIEW], [CHUNK-KPI-...], [CHUNK-PLAYBOOK-...]
  text = text.replace(/\s*\[CHUNK-[A-Z0-9_\-]+\]\s*/gi, " ");
  text = text.replace(/\bCHUNK-[A-Z0-9_\-]+\b/gi, "");

  // 2. Strip emojis/icons if any appear in answer/evidence
  text = text.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );

  // 3. Intelligently remove parenthesized English annotations like (Amenity Upsell), (Warehouse Rack), (StorageUnit), (warehouse_rack, 100m2), (closeIncident), (RevPAU), (Upsell), (Rule 629)
  text = text.replace(/\s*\(([^)]+)\)/g, (fullMatch, inner) => {
    const trimmedInner = inner.trim();

    // If it contains Vietnamese diacritics (e.g. "đến", "phòng", "mục tiêu"), KEEP IT
    if (VIETNAMESE_DIACRITICS_REGEX.test(trimmedInner)) {
      return fullMatch;
    }

    // If it is purely numbers, dates, math or percentage metrics (e.g. 2026-10-12, 10/13, >= 35%, 100m2, > 80%), KEEP IT
    if (/^[\d\s\-_.,/%=><+:]+(?:m2|vnd|%)?$/i.test(trimmedInner)) {
      return fullMatch;
    }

    // If it has Latin English words/phrases, REMOVE IT completely
    return "";
  });

  // 4. Translate combined statuses and English terms
  text = text.replace(
    /UNDER_MAINTENANCE\s*\/\s*PENDING_CLEARANCE/gi,
    "đang bảo trì hoặc chờ dọn dẹp"
  );
  text = text.replace(/\bAmenity Upsell\b/gi, "Bán kèm tiện ích");
  text = text.replace(/\bWarehouse Rack\b/gi, "Kệ kho");
  text = text.replace(/\bwarehouse_rack\b/gi, "kệ kho");
  text = text.replace(/\bcloseIncident\b/gi, "đóng sự cố");
  text = text.replace(/\bRevPAU\b/gi, "doanh thu bình quân mỗi phòng");
  text = text.replace(/\bUpsell\b/gi, "bán kèm tiện ích");

  // 5. Translate individual uppercase statuses
  text = text.replace(/\bUNDER_MAINTENANCE\b/g, "đang bảo trì");
  text = text.replace(/\bPENDING_CLEARANCE\b/g, "chờ dọn dẹp");
  text = text.replace(/\bAVAILABLE\b/g, "sẵn sàng sử dụng");
  text = text.replace(/\bOCCUPIED\b/g, "đang thuê");
  text = text.replace(/\bRESERVED\b/g, "đã đặt trước");
  text = text.replace(/\bINACTIVE\b/g, "ngưng hoạt động");

  // 6. Translate raw entity names if appearing standalone
  text = text.replace(/\bStorageUnit\b/g, "Phòng kho");
  text = text.replace(/\bStorageRack\b/g, "Kệ kho");

  // 7. Replace ampersand "&" with "và" in Vietnamese titles/phrases
  text = text.replace(/(\s+)&(\s+)/g, "$1và$2");

  // 8. Clean double spaces and lingering punctuation artifacts
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/\s*:\s*:\s*/g, ": ");

  return text.trim();
}
