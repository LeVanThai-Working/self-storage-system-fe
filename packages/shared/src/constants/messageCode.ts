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
  // {0} Email Is Not Verified
  MESSAGE_CODE_108: "MESSAGE_CODE_108",
  // Invalid Or Expired OTP
  MESSAGE_CODE_109: "MESSAGE_CODE_109",

  // {0} Is Inactive
  MESSAGE_CODE_110: "MESSAGE_CODE_110",
  // {0} Is Banned Or Locked
  MESSAGE_CODE_111: "MESSAGE_CODE_111",
  // {0} Has Been Deleted
  MESSAGE_CODE_112: "MESSAGE_CODE_112",

  // {0} Role Is Invalid
  MESSAGE_CODE_120: "MESSAGE_CODE_120",
  // User Must Have Role {0}
  MESSAGE_CODE_121: "MESSAGE_CODE_121",
  // You Do Not Have Permission To Manage {0}
  MESSAGE_CODE_122: "MESSAGE_CODE_122",

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
  MESSAGE_CODE_108: "{0} Email Is Not Verified",
  MESSAGE_CODE_109: "Invalid Or Expired OTP",
  MESSAGE_CODE_110: "{0} Is Inactive",
  MESSAGE_CODE_111: "{0} Is Banned Or Locked",
  MESSAGE_CODE_112: "{0} Has Been Deleted",
  MESSAGE_CODE_120: "{0} Role Is Invalid",
  MESSAGE_CODE_121: "User Must Have Role {0}",
  MESSAGE_CODE_122: "You Do Not Have Permission To Manage {0}",
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
  MESSAGE_CODE_108: "Email {0} chưa được xác thực",
  MESSAGE_CODE_109: "Mã OTP không hợp lệ hoặc đã hết hạn",
  MESSAGE_CODE_110: "{0} đang ngừng hoạt động",
  MESSAGE_CODE_111: "{0} đã bị khóa",
  MESSAGE_CODE_112: "{0} đã bị xóa",
  MESSAGE_CODE_120: "Vai trò {0} không hợp lệ",
  MESSAGE_CODE_121: "Người dùng phải có vai trò {0}",
  MESSAGE_CODE_122: "Bạn không có quyền quản lý {0}",
  MESSAGE_CODE_200: "{0} không được để trống",
  MESSAGE_CODE_201: "Mã token không hợp lệ hoặc đã hết hạn",
};

export const MESSAGE_DICTIONARY = MESSAGE_DICTIONARY_EN;
