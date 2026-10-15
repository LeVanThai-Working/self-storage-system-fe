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
  // Reservation Holding Time Exceeded
  MESSAGE_CODE_308: "MESSAGE_CODE_308",
  // Storage Unit Has Just Been Booked By Another Customer
  MESSAGE_CODE_309: "MESSAGE_CODE_309",
  // Time Slot Has Reached Maximum Capacity
  MESSAGE_CODE_310: "MESSAGE_CODE_310",
  // Invalid Or Inactive Check-in Time Slot
  MESSAGE_CODE_311: "MESSAGE_CODE_311",

  // Contract & Addendum Message Codes
  // Contract Not Found
  MESSAGE_CODE_400: "MESSAGE_CODE_400",
  // Invalid Contract Status Transition
  MESSAGE_CODE_401: "MESSAGE_CODE_401",
  // Storage Unit Is Not Available For Contract
  MESSAGE_CODE_402: "MESSAGE_CODE_402",
  // Contract Has Already Been Checked In
  MESSAGE_CODE_403: "MESSAGE_CODE_403",
  // Contract Extension Date Must Be Greater Than Current End Date
  MESSAGE_CODE_404: "MESSAGE_CODE_404",
  // Cannot Delete Entity With Active Contracts
  MESSAGE_CODE_405: "MESSAGE_CODE_405",
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
  // Payment Account Mismatch
  MESSAGE_CODE_508: "MESSAGE_CODE_508",

  // Storage Rack & Tier
  // Storage Rack Not Found
  MESSAGE_CODE_600: "MESSAGE_CODE_600",
  // Rack Tier Not Found
  MESSAGE_CODE_601: "MESSAGE_CODE_601",
  // Invalid Storage Rack Status Transition
  MESSAGE_CODE_602: "MESSAGE_CODE_602",
  // Storage Rack Code Already Exists
  MESSAGE_CODE_603: "MESSAGE_CODE_603",

  // Customer SKU
  // Customer SKU Not Found
  MESSAGE_CODE_610: "MESSAGE_CODE_610",
  // Customer SKU Code Already Exists
  MESSAGE_CODE_611: "MESSAGE_CODE_611",
  // Customer SKU Barcode Already Exists
  MESSAGE_CODE_612: "MESSAGE_CODE_612",
  // Cannot Delete SKU With Active Inventory
  MESSAGE_CODE_613: "MESSAGE_CODE_613",
  // Invalid Customer SKU Status Transition
  MESSAGE_CODE_614: "MESSAGE_CODE_614",
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
  MESSAGE_CODE_308: "Reservation Holding Time Exceeded",
  MESSAGE_CODE_309: "Storage Unit Has Just Been Booked By Another Customer",
  MESSAGE_CODE_310: "Time Slot Has Reached Maximum Capacity",
  MESSAGE_CODE_311: "Invalid Or Inactive Check-in Time Slot",
  MESSAGE_CODE_400: "Contract Not Found",
  MESSAGE_CODE_401: "Invalid Contract Status Transition",
  MESSAGE_CODE_402: "Storage Unit Is Not Available For Contract",
  MESSAGE_CODE_403: "Contract Has Already Been Checked In",
  MESSAGE_CODE_404: "Contract Extension Date Must Be Greater Than Current End Date",
  MESSAGE_CODE_405: "Cannot Delete Entity With Active Contracts",
  MESSAGE_CODE_406: "Reservation Must Be Confirmed Or Completed To Create Contract",
  MESSAGE_CODE_407: "Storage Unit Facility Mismatch",
  MESSAGE_CODE_408: "Insufficient Amenity Quantity For Contract",
  MESSAGE_CODE_409: "Contract Addendum Not Found",
  MESSAGE_CODE_410: "Invalid Contract Addendum Status Transition",
  MESSAGE_CODE_411: "Contract Terms Must Be Accepted",
  MESSAGE_CODE_412: "Party Has Already Signed",
  MESSAGE_CODE_413: "Insufficient Contracted Amenity Quantity To Remove",
  MESSAGE_CODE_500: "Payment Session Not Found",
  MESSAGE_CODE_501: "Facility Bank Account Is Not Configured",
  MESSAGE_CODE_502: "Payment Has Expired",
  MESSAGE_CODE_503: "Contract Is Not In Pending Deposit Status",
  MESSAGE_CODE_504: "Payment Cannot Be Cancelled",
  MESSAGE_CODE_505: "Order Is Not Awaiting Payment",
  MESSAGE_CODE_506: "Webhook Verification Failed",
  MESSAGE_CODE_507: "Payment Already Settled",
  MESSAGE_CODE_508: "Payment Account Mismatch",
  MESSAGE_CODE_600: "Storage Rack Not Found",
  MESSAGE_CODE_601: "Rack Tier Not Found",
  MESSAGE_CODE_602: "Invalid Storage Rack Status Transition",
  MESSAGE_CODE_603: "Storage Rack Code Already Exists",
  MESSAGE_CODE_610: "Customer SKU Not Found",
  MESSAGE_CODE_611: "Customer SKU Code Already Exists",
  MESSAGE_CODE_612: "Customer SKU Barcode Already Exists",
  MESSAGE_CODE_613: "Cannot Delete SKU With Active Inventory",
  MESSAGE_CODE_614: "Invalid Customer SKU Status Transition",
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
  MESSAGE_CODE_308: "Thời gian giữ chỗ của đơn đã vượt quá giới hạn",
  MESSAGE_CODE_309: "Ô kho vừa được khách hàng khác đặt chỗ",
  MESSAGE_CODE_310: "Khung giờ nhận kho đã đạt số lượng tối đa",
  MESSAGE_CODE_311: "Khung giờ nhận kho không hợp lệ hoặc đã ngừng hoạt động",
  MESSAGE_CODE_400: "Hợp đồng không tồn tại",
  MESSAGE_CODE_401: "Chuyển đổi trạng thái hợp đồng không hợp lệ",
  MESSAGE_CODE_402: "Ô kho không sẵn sàng để tạo hợp đồng",
  MESSAGE_CODE_403: "Hợp đồng đã hoàn tất thủ tục nhận kho",
  MESSAGE_CODE_404: "Ngày gia hạn hợp đồng phải lớn hơn ngày kết thúc hiện tại",
  MESSAGE_CODE_405: "Không thể xóa thực thể đang có hợp đồng hoạt động",
  MESSAGE_CODE_406: "Đơn đặt chỗ phải được xác nhận hoặc hoàn tất để tạo hợp đồng",
  MESSAGE_CODE_407: "Ô kho không thuộc cơ sở của hợp đồng",
  MESSAGE_CODE_408: "Tiện ích tại cơ sở không đủ số lượng cho hợp đồng",
  MESSAGE_CODE_409: "Không tìm thấy phụ lục hợp đồng",
  MESSAGE_CODE_410: "Chuyển đổi trạng thái phụ lục hợp đồng không hợp lệ",
  MESSAGE_CODE_411: "Vui lòng đồng ý với các điều khoản trước khi ký xác nhận",
  MESSAGE_CODE_412: "Bên này đã ký xác nhận trước đó",
  MESSAGE_CODE_413: "Số lượng tiện ích yêu cầu tháo dỡ vượt quá số lượng đang thuê hợp lệ",
  MESSAGE_CODE_500: "Không tìm thấy phiên thanh toán",
  MESSAGE_CODE_501: "Cơ sở kho chưa cấu hình tài khoản ngân hàng nhận thanh toán",
  MESSAGE_CODE_502: "Mã QR thanh toán đã hết hạn",
  MESSAGE_CODE_503: "Hợp đồng chưa ở trạng thái chờ đặt cọc",
  MESSAGE_CODE_504: "Không thể hủy phiên thanh toán ở trạng thái hiện tại",
  MESSAGE_CODE_505: "Đơn chưa ở bước chờ thanh toán hoặc đã được thanh toán xong",
  MESSAGE_CODE_506: "Xác thực giao dịch thanh toán thất bại",
  MESSAGE_CODE_507: "Khoản thanh toán đã hoàn tất trước đó",
  MESSAGE_CODE_508: "Thông tin tài khoản thanh toán không trùng khớp",
  MESSAGE_CODE_600: "Không tìm thấy giá kệ",
  MESSAGE_CODE_601: "Không tìm thấy tầng kệ",
  MESSAGE_CODE_602: "Chuyển đổi trạng thái giá kệ không hợp lệ",
  MESSAGE_CODE_603: "Mã giá kệ đã tồn tại",
  MESSAGE_CODE_610: "Không tìm thấy mã hàng SKU",
  MESSAGE_CODE_611: "Mã hàng SKU đã tồn tại",
  MESSAGE_CODE_612: "Mã vạch SKU đã tồn tại",
  MESSAGE_CODE_613: "Không thể xóa SKU đang có tồn kho hoạt động",
  MESSAGE_CODE_614: "Chuyển đổi trạng thái SKU không hợp lệ",
};

export const MESSAGE_DICTIONARY = MESSAGE_DICTIONARY_EN;
