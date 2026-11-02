/**
 * Chuyển đổi input ngày (YYYY-MM-DD hoặc Date hoặc ISO) sang định dạng chuẩn ISO 8601 đầy đủ (UTC .toISOString()) theo quy chuẩn Backend
 * Ví dụ:
 * - Start of day: "2026-11-02T00:00:00.000Z"
 * - End of day: "2028-11-03T23:59:59.000Z"
 */
export function formatToBackendDateTime(
  dateVal: string | Date | null | undefined,
  isEndOfDay = false
): string {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) return "";
    // Nếu ở dạng YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T${isEndOfDay ? "23:59:59.000Z" : "00:00:00.000Z"}`;
    }
    // Nếu có dạng YYYY-MM-DDTHH:mm:ss...
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      const baseDate = trimmed.slice(0, 10);
      if (isEndOfDay) {
        return `${baseDate}T23:59:59.000Z`;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
      return `${baseDate}T00:00:00.000Z`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      if (isEndOfDay) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const date = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${date}T23:59:59.000Z`;
      }
      return d.toISOString();
    }
    return trimmed;
  }
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    if (isEndOfDay) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const date = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${date}T23:59:59.000Z`;
    }
    return d.toISOString();
  }
  return "";
}

/**
 * Hiển thị ngày dạng DD/MM/YYYY mà không bị ảnh hưởng bởi lệch múi giờ
 */
export function formatDateOnly(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const trimmed = iso.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const datePart = trimmed.slice(0, 10);
      const [y, m, d] = datePart.split("-");
      if (y && m && d) {
        return `${d}/${m}/${y}`;
      }
    }
    const dt = new Date(trimmed);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
