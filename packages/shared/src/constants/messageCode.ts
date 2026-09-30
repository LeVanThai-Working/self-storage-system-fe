export const MESSAGE_CODE = {
  // Operation Successful
  MESSAGE_CODE_001: "MESSAGE_CODE_001",
  // {0} Created Successfully
  MESSAGE_CODE_002: "MESSAGE_CODE_002",
  // {0} Updated Successfully
  MESSAGE_CODE_003: "MESSAGE_CODE_003",
  // {0} Deleted Successfully
  MESSAGE_CODE_004: "MESSAGE_CODE_004",

  // Invalid Request
  MESSAGE_CODE_101: "MESSAGE_CODE_101",
  // Unauthorized Access
  MESSAGE_CODE_102: "MESSAGE_CODE_102",
  // Access Denied
  MESSAGE_CODE_103: "MESSAGE_CODE_103",
  // {0} Not Found
  MESSAGE_CODE_104: "MESSAGE_CODE_104",
  // {0} Already Exists
  MESSAGE_CODE_105: "MESSAGE_CODE_105",
  // Internal Server Error
  MESSAGE_CODE_106: "MESSAGE_CODE_106",
  // Invalid Email Or Password
  MESSAGE_CODE_107: "MESSAGE_CODE_107",

  // {0} Is Required
  MESSAGE_CODE_200: "MESSAGE_CODE_200",
  // Invalid Token
  MESSAGE_CODE_201: "MESSAGE_CODE_201",
} as const;

export type MessageCode = (typeof MESSAGE_CODE)[keyof typeof MESSAGE_CODE];

/**
 * Default English translations from the backend.
 */
export const MESSAGE_DICTIONARY_EN: Record<string, string> = {
  MESSAGE_CODE_001: "Operation Successful",
  MESSAGE_CODE_002: "{0} Created Successfully",
  MESSAGE_CODE_003: "{0} Updated Successfully",
  MESSAGE_CODE_004: "{0} Deleted Successfully",
  MESSAGE_CODE_101: "Invalid Request",
  MESSAGE_CODE_102: "Unauthorized Access",
  MESSAGE_CODE_103: "Access Denied",
  MESSAGE_CODE_104: "{0} Not Found",
  MESSAGE_CODE_105: "{0} Already Exists",
  MESSAGE_CODE_106: "Internal Server Error",
  MESSAGE_CODE_107: "Invalid Email Or Password",
  MESSAGE_CODE_200: "{0} Is Required",
  MESSAGE_CODE_201: "Invalid Token",
};

/**
 * Standardized Vietnamese translations for the system.
 */
export const MESSAGE_DICTIONARY_VI: Record<string, string> = {
  MESSAGE_CODE_001: "Thao tác thành công",
  MESSAGE_CODE_002: "{0} đã được tạo thành công",
  MESSAGE_CODE_003: "{0} đã được cập nhật thành công",
  MESSAGE_CODE_004: "{0} đã được xóa thành công",
  MESSAGE_CODE_101: "Yêu cầu không hợp lệ",
  MESSAGE_CODE_102: "Chưa được xác thực danh tính",
  MESSAGE_CODE_103: "Bạn không có quyền truy cập",
  MESSAGE_CODE_104: "{0} không tồn tại",
  MESSAGE_CODE_105: "{0} đã tồn tại trong hệ thống",
  MESSAGE_CODE_106: "Lỗi hệ thống máy chủ",
  MESSAGE_CODE_107: "Email hoặc mật khẩu không chính xác",
  MESSAGE_CODE_200: "{0} không được để trống",
  MESSAGE_CODE_201: "Mã token không hợp lệ hoặc đã hết hạn",
};

export const MESSAGE_DICTIONARY = MESSAGE_DICTIONARY_EN;
