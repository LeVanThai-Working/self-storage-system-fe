# MODULE: statistics (AI RAG Profit Advisor & Chat Bubble Widget)

Tài liệu bàn giao hợp đồng dữ liệu và hướng dẫn tích hợp Frontend (E2E) cho phân hệ **Trợ lý AI RAG Phân Tích Báo Cáo & Tư Vấn Tối Ưu Lợi Nhuận (AI RAG Profit Advisor)**.
Phạm vi bao gồm thư viện dùng chung `packages/shared` (schemas, types, enums) và ứng dụng Web `apps/web` (Giao diện Bong bóng Chat nổi cho vai trò `business_ops_manager`).

---

## 1. Phạm vi

- **Nền tảng:** `web` (`apps/web`) và `packages/shared`.
- **Role và khu vực FE:**
  | Role                   | Nền tảng / khu vực FE     | Phạm vi dữ liệu                                                         |
  | ---------------------- | ------------------------- | ----------------------------------------------------------------------- |
  | `business_ops_manager` | Web `/business-ops/*`     | Toàn quyền phân tích toàn chuỗi hoặc lọc theo từng cơ sở (`facilityId`) |
  | `system_admin`         | Web `/system-admin/*`     | Toàn quyền phân tích toàn hệ thống và chạy kiểm định tự động (Eval API) |
  | `facility_manager`     | Web `/facility-manager/*` | Tự động khóa vào cơ sở được phân công (`assignedFacilityId`)            |
- **Vị trí hiển thị trên UI:**
  - **Bong bóng Chat nổi (Floating Chat Bubble):** Cố định tại góc dưới bên phải màn hình (`fixed bottom-6 right-6 z-50`) trên toàn bộ các trang báo cáo điều hành của `business_ops_manager` (`/business-ops/*`).
  - **Cửa sổ Chat (Chat Window / Popover / Drawer):** Bấm vào bong bóng chat để bung mở cửa sổ tương tác thông minh với trợ lý AI.

---

## 2. Mô tả Nghiệp vụ

Trợ lý AI RAG Profit Advisor được xây dựng trên 8 trụ cột chuẩn công nghiệp:

1. **Semantic Chunking & Dynamic Context:** Tổng hợp thời gian thực từ 5 báo cáo vận hành & tài chính (`Overview`, `RentalTrends`, `FacilitiesKpi`, `FinancialAnalytics`, `ProductAndOperations`) kết hợp cùng 4 cẩm nang chiến lược giá, công nợ, vận hành và bán kèm tiện ích (Playbooks).
2. **Hybrid Retrieval (Vector + Lexical):** Kết hợp tìm kiếm tương đồng vector (`gemini-embedding-001`) và BM25 từ khóa để lấy Top-K đoạn ngữ cảnh liên quan nhất.
3. **Complexity Router:** Phân loại độ khó câu hỏi thông minh (`SIMPLE` dùng `gemini-3.5-flash-lite`, `COMPLEX` dùng `gemini-3.8-flash`).
4. **Strict Grounding & Zero-Hallucination:** Tuyệt đối không bịa đặt số liệu; từ chối trả lời câu hỏi ngoài lề (`out_of_scope_rejected`) và câu hỏi về chi phí ngoài hệ thống (`insufficient_data`).
5. **XML Sandboxing & Prompt Injection Defense:** Độc lập hoàn toàn câu hỏi người dùng với chỉ thị hệ thống, chặn các lệnh can thiệp trái phép với mã lỗi `MESSAGE_CODE_821`.
6. **Post-Generation Citation Verifier:** Kiểm chứng tính xác thực của mọi trích dẫn, loại bỏ các `chunkId` ảo.
7. **Normalized Redis Query Cache:** Tự động lưu cache 30 phút theo câu hỏi chuẩn hóa (hỗ trợ cờ `refresh: true` để buộc tính toán mới).
8. **Automated Evaluation Suite:** Cung cấp API đo lường độ tin cậy và chất lượng RAG tự động trên bộ 10 kịch bản chuẩn (Golden Dataset).

---

## 3. Endpoints

| Method | Path                         | Mô tả                                                                                                 | Role cho phép                                              | Phân trang |
| ------ | ---------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| `POST` | `/statistics/ai-rag-advisor` | Gửi câu hỏi cho Trợ lý RAG phân tích số liệu, trả về cơ hội dòng tiền, khuyến nghị và trích dẫn nguồn | `business_ops_manager`, `system_admin`, `facility_manager` | —          |
| `GET`  | `/statistics/ai-rag-eval`    | Chạy bộ kiểm định chất lượng tự động 10 kịch bản (Golden Dataset) đo lường độ chính xác RAG           | `business_ops_manager`, `system_admin`                     | —          |

---

## 4. Request Schemas (thêm vào `packages/shared/src/schemas/request/`)

Thư viện validate: Zod `^4.6.5` (cùng phiên bản v4 với Frontend).

### `src/modules/statistics/schemas/statistics.request.schema.ts`

```ts
import { z } from "zod";
import {
  StatisticsGranularityEnum,
  FacilityKpiTierEnum,
  FacilityKpiSortByEnum,
  AiInsightFocusAreaEnum,
} from "../../../common/enums/statistics.enum.ts";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const statisticsBaseQuerySchema = z.object({
  fromDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid fromDate format",
    })
    .optional(),
  toDate: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid toDate format",
    })
    .optional(),
  facilityId: z.string().trim().regex(objectIdRegex, "Invalid facility ID format").optional(),
});

export const ragAdvisorRequestSchema = statisticsBaseQuerySchema.extend({
  question: z
    .string()
    .trim()
    .min(3, "Question must be at least 3 characters")
    .max(1000, "Question cannot exceed 1000 characters"),
  focusArea: z
    .enum([
      AiInsightFocusAreaEnum.ALL,
      AiInsightFocusAreaEnum.REVENUE_GROWTH,
      AiInsightFocusAreaEnum.OCCUPANCY,
      AiInsightFocusAreaEnum.DEBT_COLLECTION,
      AiInsightFocusAreaEnum.OPERATIONAL_EFFICIENCY,
    ])
    .default(AiInsightFocusAreaEnum.ALL)
    .optional(),
  topK: z.coerce.number().int().min(1).max(8).default(5).optional(),
  refresh: z.boolean().default(false).optional(),
});

export type StatisticsBaseQuery = z.infer<typeof statisticsBaseQuerySchema>;
export type RagAdvisorRequest = z.infer<typeof ragAdvisorRequestSchema>;
```

---

## 5. Response Shapes & TypeScript Types (cập nhật `packages/shared/src/types/`)

Mọi phản hồi từ Backend đều được bọc trong wrapper chuẩn:

```ts
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  messageCode: string;
  message: string;
  data: T;
}
```

- **Tiền tệ:** Luôn là số nguyên VND (`Math.round`, không có số thập phân).
- **Ngày tháng:** Chuỗi ISO 8601 UTC/VN.
- **Trường tham chiếu:** `scopedFacilityId` trả về `string | null` (`null` thể hiện phạm vi toàn chuỗi hệ thống).

### `POST /statistics/ai-rag-advisor` → `RagAdvisorResponse`

```ts
export interface RagChunkCitation {
  chunkId: string; // Ví dụ: "CHUNK-OVERVIEW", "CHUNK-FINANCE", "CHUNK-PLAYBOOK-DEBT"
  category: RagChunkTypeEnum; // Danh mục chunk theo enum chuẩn
  title: string; // Tiêu đề tiếng Việt đầy đủ của nguồn báo cáo / cẩm nang
  excerpt: string; // Đoạn trích dẫn bằng chứng thực tế
  relevanceScore: number; // Điểm tương đồng hybrid (0.00 - 1.00)
}

export interface AiRecommendationItem {
  id: string; // Mã khuyến nghị: "REC-DEBT-01", "REC-OPS-01", ...
  category: AiInsightCategoryEnum; // Phân loại khuyến nghị
  priority: AiInsightPriorityEnum; // Mức độ ưu tiên: "high" | "medium" | "low"
  title: string; // Tiêu đề hành động bằng tiếng Việt
  dataEvidence: string; // Căn cứ dữ liệu trích xuất khách quan từ báo cáo (thuần Việt, không chứa mã [CHUNK-...])
  actionSteps: string[]; // Các bước triển khai cụ thể bằng tiếng Việt
  expectedProfitImpact: string; // Tác động tài chính định tính
  estimatedImpactVnd: number; // Ước tính giá trị thu hồi / gia tăng (số nguyên VND)
  targetFacilityCodes: string[]; // Danh sách mã chi nhánh áp dụng: ["HN01", "SGN01"]
}

export interface RagOpportunityMetrics {
  recoverableOverdueVnd: number; // Tiền nợ quá hạn có thể thu hồi (VND)
  maintenanceRevenueLossVnd: number; // Doanh thu thất thoát do kho kẹt bảo trì/dọn dẹp (VND)
  idleCapacityOpportunityVnd: number; // Tiềm năng lấp đầy công suất trống đến mục tiêu 80% (VND)
  totalOpportunityVnd: number; // Tổng giá trị cơ hội cải thiện dòng tiền (VND)
}

export interface RagAdvisorResponse {
  period: {
    fromDate: string;
    toDate: string;
    scopedFacilityId: string | null;
    focusArea: AiInsightFocusAreaEnum;
  };
  queryInfo: {
    question: string;
    normalizedQuestion: string;
    groundingStatus: RagGroundingStatusEnum; // "grounded" | "insufficient_data" | "out_of_scope_rejected"
    router: {
      complexity: RagQueryComplexityEnum; // "simple" | "complex"
      selectedModel: string; // "gemini-3.5-flash-lite" | "gemini-3.8-flash"
      provider: AiAdvisorProviderEnum; // "gemini" | "grounded_deterministic_fallback"
      reason: string;
    };
    cached: boolean; // true: kết quả lấy từ Redis cache (< 50ms); false: sinh mới
    generatedAt: string;
  };
  answer: string; // Lời giải thích tổng hợp từ AI, định dạng tiếng Việt chuẩn mực, bố cục thoáng mắt, tuyệt đối KHÔNG có icon/emoji và không chứa mã raw [CHUNK-...]
  opportunityMetrics: RagOpportunityMetrics; // Các chỉ số cơ hội lợi nhuận
  recommendations: AiRecommendationItem[]; // Danh sách các hành động khuyến nghị
  citations: RagChunkCitation[]; // Bằng chứng trích dẫn nguồn có cấu trúc
  retrievedChunkIds: string[]; // Danh sách chunk ID đã dùng làm ngữ cảnh
}
```

### `GET /statistics/ai-rag-eval` → `RagEvalResponse`

```ts
export interface RagEvalCaseResult {
  caseId: string;
  category: string;
  question: string;
  expectedComplexity: RagQueryComplexityEnum;
  actualComplexity: RagQueryComplexityEnum;
  expectedGroundingStatus: RagGroundingStatusEnum;
  actualGroundingStatus: RagGroundingStatusEnum;
  expectedChunkIds: string[];
  retrievedChunkIds: string[];
  retrievalHit: boolean;
  citationFaithful: boolean;
  routerMatched: boolean;
  guardrailPassed: boolean;
  passed: boolean;
}

export interface RagEvalResponse {
  summary: {
    totalCases: number;
    passedCases: number;
    retrievalHitRatePercent: number; // Tỷ lệ truy xuất đúng tài liệu (%)
    citationFaithfulnessPercent: number; // Tỷ lệ trích dẫn trung thực (%)
    routerAccuracyPercent: number; // Tỷ lệ định tuyến model chính xác (%)
    guardrailDefenseRatePercent: number; // Tỷ lệ chặn Prompt Injection & câu hỏi xấu (%)
    overallPassRatePercent: number; // Tỷ lệ vượt qua tổng thể (%)
    evaluatedAt: string;
  };
  cases: RagEvalCaseResult[];
}
```

---

## 6. Enums (cập nhật `packages/shared/src/enums/`)

### File BE: `src/common/enums/statistics.enum.ts`

```ts
export enum RagQueryComplexityEnum {
  SIMPLE = "simple",
  COMPLEX = "complex",
}

export enum RagGroundingStatusEnum {
  GROUNDED = "grounded",
  INSUFFICIENT_DATA = "insufficient_data",
  OUT_OF_SCOPE_REJECTED = "out_of_scope_rejected",
}

export enum AiInsightCategoryEnum {
  PRICING_AND_PROMOTION = "pricing_and_promotion",
  OCCUPANCY_AND_CAPACITY = "occupancy_and_capacity",
  UPSELL_AND_PRODUCT_MIX = "upsell_and_product_mix",
  CASHFLOW_AND_DEBT = "cashflow_and_debt",
  OPERATIONS_AND_SLA = "operations_and_sla",
}

export enum AiInsightPriorityEnum {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum AiInsightFocusAreaEnum {
  ALL = "all",
  REVENUE_GROWTH = "revenue_growth",
  OCCUPANCY = "occupancy",
  DEBT_COLLECTION = "debt_collection",
  OPERATIONAL_EFFICIENCY = "operational_efficiency",
}

export enum AiAdvisorProviderEnum {
  GEMINI = "gemini",
  GROUNDED_DETERMINISTIC_FALLBACK = "grounded_deterministic_fallback",
}

export enum RagChunkTypeEnum {
  OVERVIEW = "overview",
  RENTAL_TRENDS = "rental_trends",
  FACILITY_KPI = "facility_kpi",
  FINANCIAL_ANALYTICS = "financial_analytics",
  PRODUCT_AND_OPERATIONS = "product_and_operations",
  PLAYBOOK_PRICING = "playbook_pricing",
  PLAYBOOK_DEBT = "playbook_debt",
  PLAYBOOK_OPERATIONS = "playbook_operations",
  PLAYBOOK_UPSELL = "playbook_upsell",
}

export const RAG_CHUNK_TYPE_LABELS_VN: Record<RagChunkTypeEnum, string> = {
  [RagChunkTypeEnum.OVERVIEW]: "Báo cáo Tổng quan Điều hành & Lợi nhuận",
  [RagChunkTypeEnum.RENTAL_TRENDS]: "Báo cáo Xu hướng Thời gian & Nhu cầu Thuê",
  [RagChunkTypeEnum.FACILITY_KPI]: "Bảng điểm KPI & Hiệu suất Chi nhánh",
  [RagChunkTypeEnum.FINANCIAL_ANALYTICS]: "Báo cáo Phân tích Tài chính, Dòng tiền & Tuổi nợ",
  [RagChunkTypeEnum.PRODUCT_AND_OPERATIONS]: "Báo cáo Hiệu suất Sản phẩm & Phễu Vận hành",
  [RagChunkTypeEnum.PLAYBOOK_PRICING]: "Cẩm nang Chiến lược Giá & Tối ưu Công suất",
  [RagChunkTypeEnum.PLAYBOOK_DEBT]: "Quy định Quản trị Công nợ & Xử lý Vi phạm",
  [RagChunkTypeEnum.PLAYBOOK_OPERATIONS]: "Cẩm nang Giảm Thất thoát & Tối ưu Vận hành",
  [RagChunkTypeEnum.PLAYBOOK_UPSELL]: "Chiến lược Bán kèm Tiện ích & Giữ chân Khách hàng",
};

export enum RagChunkTypeEnum {
  OVERVIEW = "overview",
  RENTAL_TRENDS = "rental_trends",
  FACILITY_KPI = "facility_kpi",
  FINANCIAL_ANALYTICS = "financial_analytics",
  PRODUCT_AND_OPERATIONS = "product_and_operations",
  PLAYBOOK_PRICING = "playbook_pricing",
  PLAYBOOK_DEBT = "playbook_debt",
  PLAYBOOK_OPERATIONS = "playbook_operations",
  PLAYBOOK_UPSELL = "playbook_upsell",
}

export const RAG_CHUNK_TYPE_LABELS_VN: Record<RagChunkTypeEnum, string> = {
  [RagChunkTypeEnum.OVERVIEW]: "Báo cáo Tổng quan Điều hành & Lợi nhuận",
  [RagChunkTypeEnum.RENTAL_TRENDS]: "Báo cáo Xu hướng Thời gian & Nhu cầu Thuê",
  [RagChunkTypeEnum.FACILITY_KPI]: "Bảng điểm KPI & Hiệu suất Chi nhánh",
  [RagChunkTypeEnum.FINANCIAL_ANALYTICS]: "Báo cáo Phân tích Tài chính, Dòng tiền & Tuổi nợ",
  [RagChunkTypeEnum.PRODUCT_AND_OPERATIONS]: "Báo cáo Hiệu suất Sản phẩm & Phễu Vận hành",
  [RagChunkTypeEnum.PLAYBOOK_PRICING]: "Cẩm nang Chiến lược Giá & Tối ưu Công suất",
  [RagChunkTypeEnum.PLAYBOOK_DEBT]: "Quy định Quản trị Công nợ & Xử lý Vi phạm",
  [RagChunkTypeEnum.PLAYBOOK_OPERATIONS]: "Cẩm nang Giảm Thất thoát & Tối ưu Vận hành",
  [RagChunkTypeEnum.PLAYBOOK_UPSELL]: "Chiến lược Bán kèm Tiện ích & Giữ chân Khách hàng",
};
```

---

## 7. Error Codes & Thông Báo Người Dùng

| Message Code       | HTTP | Mẫu Tiếng Anh                                                 | Bản Dịch Tiếng Việt Đề Xuất                                                      | Hành Vi Trên Giao Diện FE                                              |
| ------------------ | ---- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `MESSAGE_CODE_821` | 400  | Prompt Injection Or Unsafe Instruction Detected In AI Query   | Phát hiện lệnh can thiệp trái phép (Prompt Injection) hoặc chỉ thị không an toàn | Hiển thị thông báo đỏ cảnh báo người dùng đặt câu hỏi nghiệp vụ hợp lệ |
| `MESSAGE_CODE_820` | 400  | Invalid Statistics Date Range Or Exceeds Maximum Allowed Days | Khoảng thời gian thống kê không hợp lệ hoặc vượt quá 366 ngày                    | Báo lỗi chọn ngày trên bộ lọc Date Range                               |
| `MESSAGE_CODE_102` | 401  | Unauthorized Access                                           | Truy cập trái phép (chưa xác thực)                                               | Chuyển hướng về trang Đăng nhập                                        |
| `MESSAGE_CODE_103` | 403  | Access Denied                                                 | Từ chối truy cập (không có quyền xem thống kê)                                   | Ẩn bong bóng chat nếu user không có role hợp lệ                        |
| `MESSAGE_CODE_122` | 403  | {0} Is Not Assigned To This Facility                          | Bạn không được phân công phụ trách cơ sở này                                     | Hiển thị toast lỗi phân quyền cơ sở                                    |

---

## 8. Hướng Dẫn Tích Hợp UI/UX: Bong Bóng Chat (Floating Chat Bubble)

### 8.1. Cấu Trúc Thành Phần Giao Diện (Component Hierarchy)

```text
Dashboard Layout (/business-ops/*)
 └── RagAdvisorChatWidget (fixed bottom-6 right-6 z-50)
      ├── FloatingTriggerButton (Icon tia sét AI / Robot + Pulse effect)
      └── ChatWindowContainer (Popover / Drawer 420px x 620px)
           ├── ChatHeader
           │    ├── FocusAreaSelect (Dropdown chọn trọng tâm)
           │    ├── DateAndFacilitySyncBadge (Đồng bộ với Dashboard)
           │    └── WindowControls (Nút đóng, mở rộng, reset)
           ├── QuickPromptPills (Gợi ý câu hỏi nhanh khi chat trống)
           ├── MessageList (Scrollable)
           │    ├── UserMessageBubble
           │    └── AiMessageBubble
           │         ├── ModelAndCacheBadge (gemini-3.5-flash-lite / gemini-3.8-flash / Cache)
           │         ├── OpportunityMetricsCard (Banner tóm tắt cơ hội dòng tiền)
           │         ├── MarkdownAnswerContent (Nội dung phân tích & giải thích)
           │         ├── ActionableRecommendationCards (Thẻ hành động theo màu Priority)
           │         └── CitationsAccordion (Trích dẫn bằng chứng minh bạch)
           └── ChatInputForm
                ├── InputField (Tối đa 1000 ký tự)
                ├── RefreshCacheCheckbox (Cờ refresh: true để ép quét mới)
                └── SendButton (Loading state khi đang phân tích)
```

### 8.2. Kịch Bản Tương Tác Chi Tiết (Interaction Flows)

1. **Gợi ý Câu Hỏi Nhanh (Quick Prompts):**
   - Khi người dùng vừa mở cửa sổ chat, hiển thị 4 pills gợi ý câu hỏi nghiệp vụ sát sườn:
     - 📌 _"Phân tích nợ quá hạn và đề xuất giải pháp thu hồi dòng tiền?"_
     - 📌 _"Các phòng kho đang kẹt bảo trì gây thất thoát bao nhiêu doanh thu?"_
     - 📌 _"Làm sao kích cầu giai đoạn thấp điểm và tăng lấp đầy kho trống?"_
     - 📌 _"Đánh giá hiệu quả bán kèm tiện ích và nâng cao chỉ số RevPAU?"_
   - Nhấp vào pill sẽ tự động điền vào ô input và gửi request.

2. **Đồng Bộ Bộ Lọc Dashboard:**
   - Lấy giá trị `fromDate`, `toDate`, và `facilityId` (nếu đang xem chi tiết một cơ sở) từ Context/URL của trang Dashboard hiện tại và tự động gắn vào payload `POST /statistics/ai-rag-advisor`.

3. **Hiển Thị Tin Nhắn Trả Lời (AI Response Rendering):**
   - **Định dạng Văn bản Phân tích (`answer`):** Backend trả về văn bản Markdown thuần Việt, được trình bày thoáng đãng với các đoạn văn ngắn cách nhau 2 dòng trống (`\n\n`), tiêu đề in đậm rõ ràng (`**...**`), gạch đầu dòng (`- `), in đậm các số liệu tài chính quan trọng và **tuyệt đối KHÔNG sử dụng icon hoặc emoji** (không có các biểu tượng như 📄, ⚠️, 💡, 🚀, 🔧, 📈...). Không còn xuất hiện mã raw kỹ thuật như `[CHUNK-OVERVIEW]` hay `[CHUNK-KPI-...]` trong văn bản câu trả lời hoặc trường `dataEvidence`.
   - **Thẻ Cơ Hội Dòng Tiền (Opportunity Metrics):** Nếu `totalOpportunityVnd > 0`, hiển thị banner nổi bật tóm tắt 3 nguồn doanh thu tiềm năng (Nợ quá hạn + Thất thoát bảo trì + Lấp đầy công suất trống) bằng số tiền VND định dạng đẹp mắt.
   - **Thẻ Khuyến Nghị Hành Động:**
     - Phân loại màu sắc theo `priority`: `HIGH` (Đỏ/Cam), `MEDIUM` (Vàng), `LOW` (Xanh dương).
     - Hiển thị đầy đủ: Tiêu đề hành động, số tiền tác động ước tính (`estimatedImpactVnd`), các bước triển khai chi tiết (`actionSteps`), và nhãn mã cơ sở áp dụng (`targetFacilityCodes`).
   - **Khối Trích Dẫn Nguồn Minh Bạch (`citations`):** Cho phép người dùng bấm mở xem đoạn trích dẫn thực tế từ báo cáo hoặc quy tắc cẩm nang kèm tên tiếng Việt đầy đủ (`title`), danh mục (`category`), và điểm tương đồng `relevanceScore` (đảm bảo tính minh bạch, số liệu khách quan từ hệ thống).

4. **Nút Làm Mới Bỏ Qua Cache (`refresh: true`):**
   - Khi tin nhắn hiển thị badge `💾 Đã lưu cache`, cung cấp nút bấm nhanh _"Phân tích lại với dữ liệu mới"_ để gửi lại câu hỏi kèm `refresh: true`, buộc hệ thống quét lại số liệu mới nhất từ MongoDB.

5. **Xử Lý Trạng Thái Ngoại Lệ:**
   - Khi `groundingStatus === 'out_of_scope_rejected'`: Hiển thị icon thông tin màu xám cùng câu trả lời lịch sự từ AI, không hiển thị thẻ khuyến nghị.
   - Khi `groundingStatus === 'insufficient_data'`: Hiển thị icon cảnh báo nhẹ giải thích hệ thống không theo dõi dữ liệu chi phí ngoài đó (lương nhân sự, tiền điện nước, chi phí quảng cáo...), từ chối bịa đặt số liệu.
   - Khi gặp lỗi `400 MESSAGE_CODE_821`: Hiển thị viền đỏ cảnh báo lệnh can thiệp trái phép, bảo vệ hệ thống.

---

## 9. Ghi Chú Kỹ Thuật Cho Developer Frontend

- **Định dạng tiền:** Mọi con số tiền tệ (`estimatedImpactVnd`, `recoverableOverdueVnd`, `totalOpportunityVnd`, ...) đều là số nguyên VND (`Math.round`), chỉ cần dùng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` để hiển thị.
- **Cache Client-side:** Nên tận dụng React Query (`useMutation` cho `askRagAdvisor`), không cần cache thêm ở frontend vì Backend đã có Redis cache 30 phút theo băm câu hỏi chuẩn hóa.
- **Auto-scroll:** Khi AI trả lời xong, tự động cuộn xuống cuối khung chat để người dùng nhìn thấy thẻ cơ hội và khuyến nghị hành động ngay lập tức.
