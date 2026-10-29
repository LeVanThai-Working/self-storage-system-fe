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
  // Storage Unit Has Just Been Booked By Another Customer
  MESSAGE_CODE_309: "MESSAGE_CODE_309",
  // Time Slot Has Reached Maximum Capacity
  MESSAGE_CODE_310: "MESSAGE_CODE_310",
  // Invalid Or Inactive Check-in Time Slot
  MESSAGE_CODE_311: "MESSAGE_CODE_311",
  // Check-in Date Has Already Passed, Cannot Confirm Reservation
  MESSAGE_CODE_319: "MESSAGE_CODE_319",
  // Facility Cannot Cancel A Confirmed Reservation
  MESSAGE_CODE_312: "MESSAGE_CODE_312",
  // Check-in Date Is Too Far In The Future
  MESSAGE_CODE_313: "MESSAGE_CODE_313",
  // Too Many Pending Reservations
  MESSAGE_CODE_314: "MESSAGE_CODE_314",
  // Check-in Time Slot Has Already Passed
  MESSAGE_CODE_315: "MESSAGE_CODE_315",
  // Replacement Unit Tier Is Lower Than Reserved
  MESSAGE_CODE_316: "MESSAGE_CODE_316",
  // Refund Is Not Pending
  MESSAGE_CODE_317: "MESSAGE_CODE_317",
  // Reservation Has An Active Linked Contract
  MESSAGE_CODE_318: "MESSAGE_CODE_318",
  // Refund Confirmer Must Be Different From Payment Confirmer (Maker-Checker Violation)
  MESSAGE_CODE_320: "MESSAGE_CODE_320",
  // Demo Refund Simulation Is Disabled In This Environment
  MESSAGE_CODE_321: "MESSAGE_CODE_321",
  // Reservation Terms Must Be Accepted
  MESSAGE_CODE_322: "MESSAGE_CODE_322",
  // Force Cancellation Requires Incident Details Or Incident ID
  MESSAGE_CODE_323: "MESSAGE_CODE_323",
  // Reservation Cannot Be Force Cancelled In Current Status
  MESSAGE_CODE_324: "MESSAGE_CODE_324",
  // Reservation Cannot Be Marked As Arrived In Current Status
  MESSAGE_CODE_325: "MESSAGE_CODE_325",
  // Customer Has Already Been Marked As Arrived
  MESSAGE_CODE_326: "MESSAGE_CODE_326",
  // Reservation Grace Period Cannot Be Extended In Current Status
  MESSAGE_CODE_327: "MESSAGE_CODE_327",
  // Check-in time slot requires at least {0} minutes preparation lead time
  MESSAGE_CODE_328: "MESSAGE_CODE_328",
  // Start date cannot exceed {0} days after check-in date
  MESSAGE_CODE_329: "MESSAGE_CODE_329",
  // No Pending Unit Reassign Proposal Found
  MESSAGE_CODE_330: "MESSAGE_CODE_330",
  // Another Unit Reassign Proposal Is Already Pending
  MESSAGE_CODE_331: "MESSAGE_CODE_331",

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

  // Inventory, Rack, Incident & Support Message Codes
  // Cannot Check Out Contract While Open Incidents Exist
  MESSAGE_CODE_421: "MESSAGE_CODE_421",
  // Cannot Void Contract: Linked Reservation Is No Longer Active
  MESSAGE_CODE_422: "MESSAGE_CODE_422",
  // Cannot Create Contract Draft Before Check-In Date Unless Customer Has Arrived
  MESSAGE_CODE_423: "MESSAGE_CODE_423",
  // Reservation Check-In Deadline Has Expired
  MESSAGE_CODE_424: "MESSAGE_CODE_424",
  // Contract dates were adjusted. Customer must re-sign the updated draft before check-in
  MESSAGE_CODE_425: "MESSAGE_CODE_425",
  // Contract Termination Requires At Least One Report File And One Evidence Photo
  MESSAGE_CODE_426: "MESSAGE_CODE_426",
  // Violation Termination Requires Violation Category
  MESSAGE_CODE_427: "MESSAGE_CODE_427",
  // Overdue Payment Termination Requires Overdue Grace Period Exceeded (At Least 5 Days Overdue)
  MESSAGE_CODE_428: "MESSAGE_CODE_428",
  // Legal Entity Not Found Or Inactive
  MESSAGE_CODE_429: "MESSAGE_CODE_429",
  // Customer Must Be At Least 18 Years Old
  MESSAGE_CODE_430: "MESSAGE_CODE_430",
  // Valid Signing Authorization Required For Facility Manager To Sign Or Check-In
  MESSAGE_CODE_431: "MESSAGE_CODE_431",
  // Signed Contract Document Required For Check-In (At Least 1 File Scan/Photo)
  MESSAGE_CODE_432: "MESSAGE_CODE_432",
  // Signed Addendum Document Required For Activation (At Least 1 File Scan/Photo)
  MESSAGE_CODE_433: "MESSAGE_CODE_433",
  // Customer Identity KYC Information Required
  MESSAGE_CODE_434: "MESSAGE_CODE_434",
  // Contract Template Not Found Or Inactive
  MESSAGE_CODE_435: "MESSAGE_CODE_435",
  // Storage Rack Not Found
  MESSAGE_CODE_600: "MESSAGE_CODE_600",
  // Rack Tier Not Found
  MESSAGE_CODE_601: "MESSAGE_CODE_601",
  // Invalid Storage Rack Status Transition
  MESSAGE_CODE_602: "MESSAGE_CODE_602",
  // Storage Rack Code Already Exists
  MESSAGE_CODE_603: "MESSAGE_CODE_603",
  // Storage Unit Does Not Support Rack Layout
  MESSAGE_CODE_604: "MESSAGE_CODE_604",
  // Invalid Rack Zone Pricing Configuration
  MESSAGE_CODE_605: "MESSAGE_CODE_605",
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
  // Inventory Record Not Found
  MESSAGE_CODE_620: "MESSAGE_CODE_620",
  // Insufficient Inventory Quantity
  MESSAGE_CODE_621: "MESSAGE_CODE_621",
  // Contract Must Be Active To Perform Inventory Operations
  MESSAGE_CODE_622: "MESSAGE_CODE_622",
  // Storage Unit Does Not Belong To Contract
  MESSAGE_CODE_623: "MESSAGE_CODE_623",
  // Rack Tier Does Not Belong To Storage Unit
  MESSAGE_CODE_624: "MESSAGE_CODE_624",
  // Rack Tier Is Inactive Or Under Maintenance
  MESSAGE_CODE_625: "MESSAGE_CODE_625",
  // Invalid Inventory Movement Quantity
  MESSAGE_CODE_626: "MESSAGE_CODE_626",
  // Destination Tier Must Be Different From Source Tier
  MESSAGE_CODE_627: "MESSAGE_CODE_627",
  // SKU Does Not Belong To Customer
  MESSAGE_CODE_628: "MESSAGE_CODE_628",
  // Storage Unit Still Contains Customer Inventory
  MESSAGE_CODE_629: "MESSAGE_CODE_629",
  // Inventory Request Not Found
  MESSAGE_CODE_630: "MESSAGE_CODE_630",
  // Invalid Or Expired Pickup Code Or OTP
  MESSAGE_CODE_631: "MESSAGE_CODE_631",
  // Invalid Inventory Request Status Transition
  MESSAGE_CODE_632: "MESSAGE_CODE_632",
  // Evidence Images Required For Handover Or Delivery
  MESSAGE_CODE_633: "MESSAGE_CODE_633",
  // Cannot Cancel Inventory Request Being Processed Or Completed
  MESSAGE_CODE_634: "MESSAGE_CODE_634",
  // Storage Rack And Rack Tier Are Required In Warehouse Rack
  MESSAGE_CODE_635: "MESSAGE_CODE_635",
  // Rack Tier Does Not Belong To Storage Rack
  MESSAGE_CODE_636: "MESSAGE_CODE_636",
  // Storage Rack Is Not Rented By Contract
  MESSAGE_CODE_637: "MESSAGE_CODE_637",
  // Source Rack Has No Active Inventory To Migrate
  MESSAGE_CODE_638: "MESSAGE_CODE_638",
  // Destination Rack Must Be Empty And Available
  MESSAGE_CODE_639: "MESSAGE_CODE_639",
  // Storage Rack Facility Mismatch
  MESSAGE_CODE_640: "MESSAGE_CODE_640",
  // Legal Basis, Incident Report Or Emergency Reason Required For Rack Migration
  MESSAGE_CODE_641: "MESSAGE_CODE_641",
  // Batch Rack Migration Requires Identical Rack Tier Count
  MESSAGE_CODE_642: "MESSAGE_CODE_642",
  // Incident Not Eligible For Emergency Rack Migration
  MESSAGE_CODE_643: "MESSAGE_CODE_643",
  // Contract Status Does Not Allow This Inventory Operation
  MESSAGE_CODE_644: "MESSAGE_CODE_644",
  // Inventory Item Status Does Not Allow This Operation
  MESSAGE_CODE_645: "MESSAGE_CODE_645",
  // Invalid Inventory Item Status Transition
  MESSAGE_CODE_646: "MESSAGE_CODE_646",
  // Emergency Reason Or Incident Required For Evacuation
  MESSAGE_CODE_647: "MESSAGE_CODE_647",
  // Incident Not Found
  MESSAGE_CODE_700: "MESSAGE_CODE_700",
  // Invalid Incident Status Transition
  MESSAGE_CODE_701: "MESSAGE_CODE_701",
  // Storage Unit Not Owned By Contract
  MESSAGE_CODE_702: "MESSAGE_CODE_702",
  // Incident Has Already Been Assigned
  MESSAGE_CODE_703: "MESSAGE_CODE_703",
  // Incident Must Be Assigned Before Investigation
  MESSAGE_CODE_704: "MESSAGE_CODE_704",
  // Incident Resolution Details Required
  MESSAGE_CODE_705: "MESSAGE_CODE_705",
  // Incident Cannot Be Cancelled In Current Status
  MESSAGE_CODE_706: "MESSAGE_CODE_706",
  // Only Assignee Or Facility Manager Can Update Incident
  MESSAGE_CODE_707: "MESSAGE_CODE_707",
  // Assigned Staff Does Not Belong To Facility
  MESSAGE_CODE_708: "MESSAGE_CODE_708",
  // Storage Rack Or Tier Does Not Belong To Contract
  MESSAGE_CODE_709: "MESSAGE_CODE_709",
  // Support Ticket Not Found
  MESSAGE_CODE_720: "MESSAGE_CODE_720",
  // Invalid Support Ticket Status Transition
  MESSAGE_CODE_721: "MESSAGE_CODE_721",
  // Support Ticket Cannot Be Cancelled In Current Status
  MESSAGE_CODE_722: "MESSAGE_CODE_722",
  // Support Ticket Response Details Required
  MESSAGE_CODE_723: "MESSAGE_CODE_723",
  // Contract Does Not Belong To Customer
  MESSAGE_CODE_724: "MESSAGE_CODE_724",
  // Support Ticket Facility Mismatch
  MESSAGE_CODE_725: "MESSAGE_CODE_725",
  // Assigned Staff Does Not Belong To Facility
  MESSAGE_CODE_726: "MESSAGE_CODE_726",
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
  MESSAGE_CODE_306: "Storage Unit Does Not Match Reserved Offering",
  MESSAGE_CODE_307: "Insufficient Amenity Quantity For {0}",
  MESSAGE_CODE_309: "Storage Unit Has Just Been Booked By Another Customer",
  MESSAGE_CODE_310: "Time Slot Has Reached Maximum Capacity",
  MESSAGE_CODE_311: "Invalid Or Inactive Check-in Time Slot",
  MESSAGE_CODE_319: "Check-in Date Has Already Passed, Cannot Confirm Reservation",
  MESSAGE_CODE_312: "Facility Cannot Cancel A Confirmed Reservation",
  MESSAGE_CODE_313: "Check-in Date Is Too Far In The Future",
  MESSAGE_CODE_314: "Too Many Pending Reservations",
  MESSAGE_CODE_315: "Check-in Time Slot Has Already Passed",
  MESSAGE_CODE_316: "Replacement Unit Tier Is Lower Than Reserved",
  MESSAGE_CODE_317: "Refund Is Not Pending",
  MESSAGE_CODE_318: "Reservation Has An Active Linked Contract",
  MESSAGE_CODE_320:
    "Refund Confirmer Must Be Different From Payment Confirmer (Maker-Checker Violation)",
  MESSAGE_CODE_321: "Demo Refund Simulation Is Disabled In This Environment",
  MESSAGE_CODE_322: "Reservation Terms Must Be Accepted",
  MESSAGE_CODE_323: "Force Cancellation Requires Incident Details Or Incident ID",
  MESSAGE_CODE_324: "Reservation Cannot Be Force Cancelled In Current Status",
  MESSAGE_CODE_325: "Reservation Cannot Be Marked As Arrived In Current Status",
  MESSAGE_CODE_326: "Customer Has Already Been Marked As Arrived",
  MESSAGE_CODE_327: "Reservation Grace Period Cannot Be Extended In Current Status",
  MESSAGE_CODE_328: "Check-in time slot requires at least {0} minutes preparation lead time",
  MESSAGE_CODE_329: "Start date cannot exceed {0} days after check-in date",
  MESSAGE_CODE_330: "No Pending Unit Reassign Proposal Found",
  MESSAGE_CODE_331: "Another Unit Reassign Proposal Is Already Pending",
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
  // Inventory, Rack, Incident & Support
  MESSAGE_CODE_421: "Cannot Check Out Contract While Open Incidents Exist",
  MESSAGE_CODE_422: "Cannot Void Contract: Linked Reservation Is No Longer Active",
  MESSAGE_CODE_423: "Cannot Create Contract Draft Before Check-In Date Unless Customer Has Arrived",
  MESSAGE_CODE_424: "Reservation Check-In Deadline Has Expired",
  MESSAGE_CODE_425:
    "Contract dates were adjusted. Customer must re-sign the updated draft before check-in",
  MESSAGE_CODE_426: "Contract Termination Requires At Least One Report File And One Evidence Photo",
  MESSAGE_CODE_427: "Violation Termination Requires Violation Category",
  MESSAGE_CODE_428:
    "Overdue Payment Termination Requires Overdue Grace Period Exceeded (At Least 5 Days Overdue)",
  MESSAGE_CODE_429: "Legal Entity Not Found Or Inactive",
  MESSAGE_CODE_430: "Customer Must Be At Least 18 Years Old",
  MESSAGE_CODE_431: "Valid Signing Authorization Required For Facility Manager To Sign Or Check-In",
  MESSAGE_CODE_432: "Signed Contract Document Required For Check-In (At Least 1 File Scan/Photo)",
  MESSAGE_CODE_433: "Signed Addendum Document Required For Activation (At Least 1 File Scan/Photo)",
  MESSAGE_CODE_434: "Customer Identity KYC Information Required",
  MESSAGE_CODE_435: "Contract Template Not Found Or Inactive",
  MESSAGE_CODE_600: "Storage Rack Not Found",
  MESSAGE_CODE_601: "Rack Tier Not Found",
  MESSAGE_CODE_602: "Invalid Storage Rack Status Transition",
  MESSAGE_CODE_603: "Storage Rack Code Already Exists",
  MESSAGE_CODE_604: "Storage Unit Does Not Support Rack Layout",
  MESSAGE_CODE_605: "Invalid Rack Zone Pricing Configuration",
  MESSAGE_CODE_610: "Customer SKU Not Found",
  MESSAGE_CODE_611: "Customer SKU Code Already Exists",
  MESSAGE_CODE_612: "Customer SKU Barcode Already Exists",
  MESSAGE_CODE_613: "Cannot Delete SKU With Active Inventory",
  MESSAGE_CODE_614: "Invalid Customer SKU Status Transition",
  MESSAGE_CODE_620: "Inventory Record Not Found",
  MESSAGE_CODE_621: "Insufficient Inventory Quantity",
  MESSAGE_CODE_622: "Contract Must Be Active To Perform Inventory Operations",
  MESSAGE_CODE_623: "Storage Unit Does Not Belong To Contract",
  MESSAGE_CODE_624: "Rack Tier Does Not Belong To Storage Unit",
  MESSAGE_CODE_625: "Rack Tier Is Inactive Or Under Maintenance",
  MESSAGE_CODE_626: "Invalid Inventory Movement Quantity",
  MESSAGE_CODE_627: "Destination Tier Must Be Different From Source Tier",
  MESSAGE_CODE_628: "SKU Does Not Belong To Customer",
  MESSAGE_CODE_629: "Storage Unit Still Contains Customer Inventory",
  MESSAGE_CODE_630: "Inventory Request Not Found",
  MESSAGE_CODE_631: "Invalid Or Expired Pickup Code Or OTP",
  MESSAGE_CODE_632: "Invalid Inventory Request Status Transition",
  MESSAGE_CODE_633: "Evidence Images Required For Handover Or Delivery",
  MESSAGE_CODE_634: "Cannot Cancel Inventory Request Being Processed Or Completed",
  MESSAGE_CODE_635: "Storage Rack And Rack Tier Are Required In Warehouse Rack",
  MESSAGE_CODE_636: "Rack Tier Does Not Belong To Storage Rack",
  MESSAGE_CODE_637: "Storage Rack Is Not Rented By Contract",
  MESSAGE_CODE_638: "Source Rack Has No Active Inventory To Migrate",
  MESSAGE_CODE_639: "Destination Rack Must Be Empty And Available",
  MESSAGE_CODE_640: "Storage Rack Facility Mismatch",
  MESSAGE_CODE_641: "Legal Basis, Incident Report Or Emergency Reason Required For Rack Migration",
  MESSAGE_CODE_642: "Batch Rack Migration Requires Identical Rack Tier Count",
  MESSAGE_CODE_643: "Incident Not Eligible For Emergency Rack Migration",
  MESSAGE_CODE_644: "Contract Status Does Not Allow This Inventory Operation",
  MESSAGE_CODE_645: "Inventory Item Status Does Not Allow This Operation",
  MESSAGE_CODE_646: "Invalid Inventory Item Status Transition",
  MESSAGE_CODE_647: "Emergency Reason Or Incident Required For Evacuation",
  MESSAGE_CODE_700: "Incident Not Found",
  MESSAGE_CODE_701: "Invalid Incident Status Transition",
  MESSAGE_CODE_702: "Storage Unit Not Owned By Contract",
  MESSAGE_CODE_703: "Incident Has Already Been Assigned",
  MESSAGE_CODE_704: "Incident Must Be Assigned Before Investigation",
  MESSAGE_CODE_705: "Incident Resolution Details Required",
  MESSAGE_CODE_706: "Incident Cannot Be Cancelled In Current Status",
  MESSAGE_CODE_707: "Only Assignee Or Facility Manager Can Update Incident",
  MESSAGE_CODE_708: "Assigned Staff Does Not Belong To Facility",
  MESSAGE_CODE_709: "Storage Rack Or Tier Does Not Belong To Contract",
  MESSAGE_CODE_720: "Support Ticket Not Found",
  MESSAGE_CODE_721: "Invalid Support Ticket Status Transition",
  MESSAGE_CODE_722: "Support Ticket Cannot Be Cancelled In Current Status",
  MESSAGE_CODE_723: "Support Ticket Response Details Required",
  MESSAGE_CODE_724: "Contract Does Not Belong To Customer",
  MESSAGE_CODE_725: "Support Ticket Facility Mismatch",
  MESSAGE_CODE_726: "Assigned Staff Does Not Belong To Facility",
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
  MESSAGE_CODE_306: "Phòng kho không thuộc gói đã chọn",
  MESSAGE_CODE_307: "Tiện ích {0} tại cơ sở không đủ số lượng tồn kho",
  MESSAGE_CODE_309: "Phòng kho vừa được khách khác đặt, vui lòng chọn phòng khác",
  MESSAGE_CODE_310: "Khung giờ nhận phòng đã kín chỗ",
  MESSAGE_CODE_311: "Khung giờ nhận phòng không hợp lệ hoặc đã ngừng",
  MESSAGE_CODE_319: "Đã quá ngày hẹn nhận kho, không thể xác nhận đơn",
  MESSAGE_CODE_312: "Cơ sở không được huỷ đơn đã xác nhận (hãy đổi kho hoặc huỷ khẩn cấp)",
  MESSAGE_CODE_313: "Ngày nhận kho vượt quá giới hạn đặt trước (tối đa 30 ngày)",
  MESSAGE_CODE_314: "Bạn đã có quá nhiều đơn đang chờ thanh toán, vui lòng thanh toán hoặc huỷ bớt",
  MESSAGE_CODE_315: "Khung giờ nhận kho hôm nay đã qua, vui lòng chọn khung giờ khác",
  MESSAGE_CODE_316: "Không được đổi sang phòng kho có đơn giá thấp hơn gói đã đặt",
  MESSAGE_CODE_317: "Đơn đặt chỗ không có khoản hoàn tiền nào đang chờ",
  MESSAGE_CODE_318: "Không thể huỷ đơn vì đang có hợp đồng liên kết đang xử lý",
  MESSAGE_CODE_320: "Người xác nhận hoàn tiền phải khác người xác nhận thu tiền",
  MESSAGE_CODE_321: "Môi trường này không bật giả lập hoàn tiền",
  MESSAGE_CODE_322: "Vui lòng đồng ý Điều khoản & Chính sách đặt chỗ",
  MESSAGE_CODE_323: "Huỷ khẩn cấp cần biên bản sự cố hoặc mã sự cố",
  MESSAGE_CODE_324: "Trạng thái đơn hiện tại không cho phép huỷ khẩn cấp",
  MESSAGE_CODE_325: "Không thể ghi nhận khách đến ở trạng thái đơn hiện tại",
  MESSAGE_CODE_326: "Khách đã được ghi nhận có mặt trước đó",
  MESSAGE_CODE_327: "Trạng thái đơn hiện tại không cho phép gia hạn ân hạn",
  MESSAGE_CODE_328: "Khung giờ nhận kho trong ngày cần đặt trước ít nhất {0} phút",
  MESSAGE_CODE_329: "Ngày bắt đầu thuê không được quá {0} ngày sau ngày nhận kho",
  MESSAGE_CODE_330: "Không có đề xuất đổi kho nào đang chờ phản hồi",
  MESSAGE_CODE_331: "Đơn đang có một đề xuất đổi kho khác chờ phản hồi",
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
  // Inventory, Rack, Incident & Support
  MESSAGE_CODE_421: "Không thể trả phòng khi còn sự cố chưa đóng",
  MESSAGE_CODE_422: "Không thể huỷ hợp đồng vì đặt chỗ liên kết không còn hiệu lực",
  MESSAGE_CODE_423: "Chưa thể tạo bản nháp hợp đồng trước ngày nhận phòng, trừ khi khách đã đến",
  MESSAGE_CODE_424: "Đã quá hạn nhận phòng của đặt chỗ",
  MESSAGE_CODE_425:
    "Ngày hợp đồng đã được điều chỉnh, khách cần ký lại bản nháp mới trước khi nhận phòng",
  MESSAGE_CODE_426: "Chấm dứt hợp đồng cần ít nhất 1 biên bản và 1 ảnh bằng chứng",
  MESSAGE_CODE_427: "Chấm dứt do vi phạm cần chọn loại vi phạm",
  MESSAGE_CODE_428: "Chỉ được chấm dứt do nợ khi đã quá hạn thanh toán ít nhất 5 ngày",
  MESSAGE_CODE_429: "Không tìm thấy pháp nhân hoặc pháp nhân đã ngưng hoạt động",
  MESSAGE_CODE_430: "Khách hàng phải đủ 18 tuổi",
  MESSAGE_CODE_431: "Quản lý cơ sở cần giấy uỷ quyền ký còn hiệu lực để ký hoặc nhận phòng",
  MESSAGE_CODE_432:
    "Cần tải lên bản hợp đồng đã ký (ít nhất 1 file scan hoặc ảnh) trước khi nhận phòng",
  MESSAGE_CODE_433: "Cần tải lên phụ lục đã ký (ít nhất 1 file scan hoặc ảnh) trước khi kích hoạt",
  MESSAGE_CODE_434: "Khách hàng cần bổ sung thông tin định danh (KYC)",
  MESSAGE_CODE_435: "Không tìm thấy mẫu hợp đồng hoặc mẫu đã ngưng dùng",
  MESSAGE_CODE_600: "Không tìm thấy kệ",
  MESSAGE_CODE_601: "Không tìm thấy tầng kệ",
  MESSAGE_CODE_602: "Chuyển trạng thái kệ không hợp lệ",
  MESSAGE_CODE_603: "Mã kệ đã tồn tại trong phòng",
  MESSAGE_CODE_604: "Phòng kho này không hỗ trợ bố trí kệ",
  MESSAGE_CODE_605: "Cấu hình giá theo zone kệ không hợp lệ",
  MESSAGE_CODE_610: "Không tìm thấy mã hàng",
  MESSAGE_CODE_611: "Mã hàng đã tồn tại trong danh mục",
  MESSAGE_CODE_612: "Mã vạch đã tồn tại trong danh mục",
  MESSAGE_CODE_613: "Không thể xoá mã hàng còn tồn kho",
  MESSAGE_CODE_614: "Chuyển trạng thái mã hàng không hợp lệ",
  MESSAGE_CODE_620: "Không tìm thấy bản ghi tồn kho",
  MESSAGE_CODE_621: "Số lượng tồn kho không đủ",
  MESSAGE_CODE_622: "Hợp đồng phải đang hiệu lực để thao tác tồn kho",
  MESSAGE_CODE_623: "Phòng kho không thuộc hợp đồng này",
  MESSAGE_CODE_624: "Tầng kệ không thuộc phòng kho này",
  MESSAGE_CODE_625: "Tầng kệ đang ngừng hoạt động hoặc bảo trì",
  MESSAGE_CODE_626: "Số lượng biến động tồn kho không hợp lệ",
  MESSAGE_CODE_627: "Vị trí đích phải khác vị trí nguồn",
  MESSAGE_CODE_628: "Mã hàng không thuộc về khách hàng",
  MESSAGE_CODE_629: "Phòng kho vẫn còn hàng của khách",
  MESSAGE_CODE_630: "Không tìm thấy phiếu kho",
  MESSAGE_CODE_631: "Mã nhận hàng hoặc OTP không hợp lệ hoặc đã hết hạn",
  MESSAGE_CODE_632: "Trạng thái phiếu không cho phép thao tác này",
  MESSAGE_CODE_633: "Cần ảnh bằng chứng khi giao hoặc nhận hàng",
  MESSAGE_CODE_634: "Không thể huỷ phiếu đang xử lý hoặc đã hoàn tất",
  MESSAGE_CODE_635: "Kho kệ bắt buộc chọn kệ và tầng",
  MESSAGE_CODE_636: "Tầng không thuộc kệ đã chọn",
  MESSAGE_CODE_637: "Kệ này không thuộc hợp đồng của khách",
  MESSAGE_CODE_638: "Kệ nguồn không còn hàng để di dời",
  MESSAGE_CODE_639: "Kệ đích phải trống và sẵn sàng",
  MESSAGE_CODE_640: "Kệ không thuộc cơ sở của bạn",
  MESSAGE_CODE_641: "Cần phụ lục, sự cố hoặc lý do khẩn cấp để di dời kệ",
  MESSAGE_CODE_642: "Kệ đích phải có cùng số tầng với kệ nguồn",
  MESSAGE_CODE_643: "Sự cố không đủ điều kiện di dời kệ khẩn cấp",
  MESSAGE_CODE_644: "Trạng thái hợp đồng không cho phép thao tác này",
  MESSAGE_CODE_645: "Trạng thái hàng không cho phép thao tác này",
  MESSAGE_CODE_646: "Chuyển trạng thái hàng không hợp lệ",
  MESSAGE_CODE_647: "Cần lý do khẩn cấp hoặc sự cố để hạ hàng xuống khu lưu tạm",
  MESSAGE_CODE_700: "Không tìm thấy sự cố",
  MESSAGE_CODE_701: "Trạng thái sự cố không cho phép thao tác này",
  MESSAGE_CODE_702: "Phòng kho không thuộc hợp đồng này",
  MESSAGE_CODE_703: "Sự cố đã được phân công",
  MESSAGE_CODE_704: "Sự cố phải được phân công trước khi khảo sát",
  MESSAGE_CODE_705: "Cần nhập đầy đủ biên bản xử lý",
  MESSAGE_CODE_706: "Không thể huỷ sự cố ở trạng thái hiện tại",
  MESSAGE_CODE_707: "Chỉ nhân viên được giao hoặc quản lý cơ sở được cập nhật sự cố",
  MESSAGE_CODE_708: "Nhân viên được giao không thuộc cơ sở",
  MESSAGE_CODE_709: "Kệ hoặc tầng không thuộc hợp đồng này",
  MESSAGE_CODE_720: "Không tìm thấy yêu cầu hỗ trợ",
  MESSAGE_CODE_721: "Trạng thái yêu cầu không cho phép thao tác này",
  MESSAGE_CODE_722: "Chỉ huỷ được yêu cầu khi chưa được tiếp nhận",
  MESSAGE_CODE_723: "Cần nhập nội dung phản hồi",
  MESSAGE_CODE_724: "Hợp đồng không thuộc về khách hàng",
  MESSAGE_CODE_725: "Yêu cầu không thuộc cơ sở của bạn",
  MESSAGE_CODE_726: "Nhân viên được giao không thuộc cơ sở",
};

export const MESSAGE_DICTIONARY = MESSAGE_DICTIONARY_EN;
