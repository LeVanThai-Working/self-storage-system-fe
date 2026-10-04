/**
 * Lọc bỏ các query parameters mang giá trị undefined, null, hoặc chuỗi rỗng ("").
 * Giữ lại số 0 hoặc boolean false, tự động trim khoảng trắng của chuỗi.
 */
export const cleanQueryParams = <T extends object>(
  params?: T
): Record<string, unknown> | undefined => {
  if (!params) return undefined;

  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = typeof value === "string" ? value.trim() : value;
    }
    return acc;
  }, {});
};
