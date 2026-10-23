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

  // {0} Created Successfully (Alias)
  MESSAGE_CODE_100: "MESSAGE_CODE_100",

  // Reservation Message Codes
  // Reservation Not Found
  MESSAGE_CODE_300: "MESSAGE_CODE_300",
  // Invalid Reservation Status Transition
  MESSAGE_CODE_301: "MESSAGE_CODE_301",
  // Reservation Cannot Be Updated After Being Received
  MESSAGE_CODE_302: "MESSAGE_CODE_302",
  // Reservation Cannot Be Cancelled
  MESSAGE_CODE_303: "MESSAGE_CODE_303",
  // Reservation Has Expired
  MESSAGE_CODE_304: "MESSAGE_CODE_304",
  // Selected Storage Unit Is Not Available
  MESSAGE_CODE_305: "MESSAGE_CODE_305",
  // Start Date Cannot Be In The Past
  MESSAGE_CODE_306: "MESSAGE_CODE_306",
  // Insufficient Amenity Quantity For {0}
  MESSAGE_CODE_307: "MESSAGE_CODE_307",
  // Check-in Date Has Already Passed, Cannot Confirm Reservation
  MESSAGE_CODE_319: "MESSAGE_CODE_319",

  // Contract Message Codes
  // Contract Not Found
  MESSAGE_CODE_400: "MESSAGE_CODE_400",
  // Invalid Contract Status Transition
  MESSAGE_CODE_401: "MESSAGE_CODE_401",
  // Storage Unit Is Not Available For Contract
  MESSAGE_CODE_402: "MESSAGE_CODE_402",
  // Reservation Must Be Confirmed Or Completed To Create Contract
  MESSAGE_CODE_406: "MESSAGE_CODE_406",
  // Storage Unit Facility Mismatch
  MESSAGE_CODE_407: "MESSAGE_CODE_407",
  // Insufficient Amenity Quantity For Contract
  MESSAGE_CODE_408: "MESSAGE_CODE_408",
  // Contract Addendum Not Found
  MESSAGE_CODE_409: "MESSAGE_CODE_409",
  // Invalid Contract Addendum Status Transition
  MESSAGE_CODE_410: "MESSAGE_CODE_410",
  // Contract Terms Must Be Accepted
  MESSAGE_CODE_411: "MESSAGE_CODE_411",
  // Party Has Already Signed
  MESSAGE_CODE_412: "MESSAGE_CODE_412",
  // Insufficient Contracted Amenity Quantity To Remove
  MESSAGE_CODE_413: "MESSAGE_CODE_413",
  // Customer Must Sign Contract Before Check-In
  MESSAGE_CODE_414: "MESSAGE_CODE_414",

  // Payment Message Codes
  // Payment Not Found / Invalid Session
  MESSAGE_CODE_500: "MESSAGE_CODE_500",
  // Facility Bank Account Not Configured
  MESSAGE_CODE_501: "MESSAGE_CODE_501",
  // Payment Has Expired
  MESSAGE_CODE_502: "MESSAGE_CODE_502",
  // Contract Is Not In Pending Deposit Status
  MESSAGE_CODE_503: "MESSAGE_CODE_503",
  // Payment Cannot Be Cancelled
  MESSAGE_CODE_504: "MESSAGE_CODE_504",
  // Order Is Not Awaiting Payment
  MESSAGE_CODE_505: "MESSAGE_CODE_505",
  // Webhook Verification Failed
  MESSAGE_CODE_506: "MESSAGE_CODE_506",
  // Payment Already Settled
  MESSAGE_CODE_507: "MESSAGE_CODE_507",

  // Customer Inventory Message Codes
  // Rack Tier Not Found
  MESSAGE_CODE_601: "MESSAGE_CODE_601",
  // Customer SKU Not Found
  MESSAGE_CODE_610: "MESSAGE_CODE_610",
  // Inventory Record Not Found
  MESSAGE_CODE_620: "MESSAGE_CODE_620",
  // Insufficient Inventory Quantity
  MESSAGE_CODE_621: "MESSAGE_CODE_621",
  // Contract Must Be Active To Perform Inventory Operations
  MESSAGE_CODE_622: "MESSAGE_CODE_622",
  // Rack Tier Does Not Belong To Storage Unit
  MESSAGE_CODE_624: "MESSAGE_CODE_624",
  // Rack Tier Is Inactive Or Under Maintenance
  MESSAGE_CODE_625: "MESSAGE_CODE_625",
  // Destination Tier Must Be Different From Source Tier
  MESSAGE_CODE_627: "MESSAGE_CODE_627",
  // SKU Does Not Belong To Customer
  MESSAGE_CODE_628: "MESSAGE_CODE_628",
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
  MESSAGE_CODE_100: "{0} Created Successfully",
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
  MESSAGE_CODE_300: "Reservation Not Found",
  MESSAGE_CODE_301: "Invalid Reservation Status Transition",
  MESSAGE_CODE_302: "Reservation Cannot Be Updated After Being Received",
  MESSAGE_CODE_303: "Reservation Cannot Be Cancelled",
  MESSAGE_CODE_304: "Reservation Has Expired",
  MESSAGE_CODE_305: "Selected Storage Unit Is Not Available",
  MESSAGE_CODE_306: "Start Date Cannot Be In The Past",
  MESSAGE_CODE_307: "Insufficient Amenity Quantity For {0}",
  MESSAGE_CODE_319: "Check-in Date Has Already Passed, Cannot Confirm Reservation",
  MESSAGE_CODE_400: "Contract Not Found",
  MESSAGE_CODE_401: "Invalid Contract Status Transition",
  MESSAGE_CODE_402: "Storage Unit Is Not Available For Contract",
  MESSAGE_CODE_406: "Reservation Must Be Confirmed Or Completed To Create Contract",
  MESSAGE_CODE_407: "Storage Unit Facility Mismatch",
  MESSAGE_CODE_408: "Insufficient Amenity Quantity For Contract",
  MESSAGE_CODE_409: "Contract Addendum Not Found",
  MESSAGE_CODE_410: "Invalid Contract Addendum Status Transition",
  MESSAGE_CODE_411: "Contract Terms Must Be Accepted",
  MESSAGE_CODE_412: "Party Has Already Signed",
  MESSAGE_CODE_413: "Insufficient Contracted Amenity Quantity To Remove",
  MESSAGE_CODE_414: "Customer Must Sign Contract Before Check-In",
  MESSAGE_CODE_500: "Payment Session Not Found",
  MESSAGE_CODE_501: "Facility Bank Account Is Not Configured",
  MESSAGE_CODE_502: "Payment Has Expired",
  MESSAGE_CODE_503: "Contract Is Not In Pending Deposit Status",
  MESSAGE_CODE_504: "Payment Cannot Be Cancelled",
  MESSAGE_CODE_505: "Order Is Not Awaiting Payment",
  MESSAGE_CODE_506: "Webhook Verification Failed",
  MESSAGE_CODE_507: "Payment Already Settled",
  MESSAGE_CODE_601: "Rack Tier Not Found",
  MESSAGE_CODE_610: "Customer SKU Not Found",
  MESSAGE_CODE_620: "Inventory Record Not Found",
  MESSAGE_CODE_621: "Insufficient Inventory Quantity",
  MESSAGE_CODE_622: "Contract Must Be Active To Perform Inventory Operations",
  MESSAGE_CODE_624: "Rack Tier Does Not Belong To Storage Unit",
  MESSAGE_CODE_625: "Rack Tier Is Inactive Or Under Maintenance",
  MESSAGE_CODE_627: "Destination Tier Must Be Different From Source Tier",
  MESSAGE_CODE_628: "SKU Does Not Belong To Customer",
};

/**
 * Standardized Vietnamese translations for the system.
 */
export const MESSAGE_DICTIONARY_VI: Record<string, string> = {
  MESSAGE_CODE_001: "Thao tác thành công",
  MESSAGE_CODE_002: "{0} đã được tạo thành công",
  MESSAGE_CODE_003: "{0} đã được cập nhật thành công",
  MESSAGE_CODE_004: "{0} đã được xóa thành công",
  MESSAGE_CODE_100: "{0} đã được tạo thành công",
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
  MESSAGE_CODE_300: "Đơn đặt chỗ không tồn tại",
  MESSAGE_CODE_301: "Trạng thái đơn đặt chỗ đã thay đổi, vui lòng tải lại",
  MESSAGE_CODE_302: "Đơn đã được cơ sở tiếp nhận xử lý nên không thể chỉnh sửa thông tin",
  MESSAGE_CODE_303: "Đơn đặt chỗ không thể hủy ở trạng thái hiện tại",
  MESSAGE_CODE_304: "Thời gian giữ chỗ của đơn đã hết hạn",
  MESSAGE_CODE_305: "Ô kho được chọn hiện không còn trống",
  MESSAGE_CODE_306: "Ngày bắt đầu thuê không được nằm trong quá khứ",
  MESSAGE_CODE_307: "Tiện ích {0} tại cơ sở không đủ số lượng tồn kho",
  MESSAGE_CODE_319: "Đã quá ngày hẹn nhận kho, không thể xác nhận đơn",
  MESSAGE_CODE_400: "Hợp đồng không tồn tại",
  MESSAGE_CODE_401: "Chuyển trạng thái hợp đồng không hợp lệ",
  MESSAGE_CODE_402: "Phòng kho không khả dụng để tạo hợp đồng",
  MESSAGE_CODE_406: "Đơn đặt chỗ phải được xác nhận trước khi tạo hợp đồng",
  MESSAGE_CODE_407: "Phòng kho không thuộc cơ sở đang chọn",
  MESSAGE_CODE_408: "Tiện ích không đủ số lượng khả dụng trong kho cơ sở",
  MESSAGE_CODE_409: "Không tìm thấy phụ lục hợp đồng",
  MESSAGE_CODE_410: "Chuyển đổi trạng thái phụ lục hợp đồng không hợp lệ",
  MESSAGE_CODE_411: "Vui lòng đồng ý với các điều khoản trước khi ký xác nhận",
  MESSAGE_CODE_412: "Bên này đã ký xác nhận trước đó",
  MESSAGE_CODE_413: "Số lượng tiện ích yêu cầu tháo dỡ vượt quá số lượng đang thuê hợp lệ",
  MESSAGE_CODE_414: "Khách hàng phải ký hợp đồng trước khi cơ sở ký bàn giao kho",
  MESSAGE_CODE_500: "Không tìm thấy phiên thanh toán",
  MESSAGE_CODE_501: "Cơ sở kho chưa cấu hình tài khoản ngân hàng nhận thanh toán",
  MESSAGE_CODE_502: "Mã QR thanh toán đã hết hạn",
  MESSAGE_CODE_503: "Hợp đồng chưa ở trạng thái chờ đặt cọc",
  MESSAGE_CODE_504: "Không thể hủy phiên thanh toán ở trạng thái hiện tại",
  MESSAGE_CODE_505: "Đơn chưa ở bước chờ thanh toán hoặc đã được thanh toán xong",
  MESSAGE_CODE_506: "Xác thực giao dịch thanh toán thất bại",
  MESSAGE_CODE_507: "Khoản thanh toán đã hoàn tất trước đó",
  MESSAGE_CODE_601: "Không tìm thấy tầng kệ",
  MESSAGE_CODE_610: "Không tìm thấy mã hàng",
  MESSAGE_CODE_620: "Không tìm thấy bản ghi tồn kho",
  MESSAGE_CODE_621: "Số lượng tồn kho không đủ",
  MESSAGE_CODE_622: "Hợp đồng phải đang hiệu lực để thao tác tồn kho",
  MESSAGE_CODE_624: "Tầng kệ không thuộc phòng kho này",
  MESSAGE_CODE_625: "Tầng kệ đang ngừng hoạt động hoặc bảo trì",
  MESSAGE_CODE_627: "Vị trí đích phải khác vị trí nguồn",
  MESSAGE_CODE_628: "Mã hàng không thuộc về khách hàng",
};

export const MESSAGE_DICTIONARY = MESSAGE_DICTIONARY_EN;
