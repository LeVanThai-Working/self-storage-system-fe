import {
  Box,
  Building2,
  CalendarDays,
  CreditCard,
  Headphones,
  Headset,
  House,
  Info,
  LayoutGrid,
  Layers,
  type LucideIcon,
  MapPin,
  Maximize2,
  PackageCheck,
  Search,
  ShieldCheck,
  Tag,
  ThumbsUp,
  Users,
  Warehouse,
} from "lucide-react";

/**
 * Static landing page data. Only ids, icons, numbers and links live here —
 * every user-facing string is resolved from the `landing` i18n namespace by id.
 */

export const HOTLINE_HREF = "tel:19008899";
export const SEARCH_PANEL_ID = "storage-search-panel";

/** Icons replace the nav labels on mid-size screens where the text nav no longer fits */
export const NAV_ITEMS: { id: string; href: string; icon: LucideIcon }[] = [
  { id: "home", href: "#top", icon: House },
  { id: "storage", href: `#${SEARCH_PANEL_ID}`, icon: Warehouse },
  { id: "pricing", href: "#pricing", icon: Tag },
  { id: "about", href: "#about", icon: Info },
  { id: "support", href: "#support", icon: Headset },
];

export const SEARCH_FILTER_ALL = "all";

export const SEARCH_FIELDS = [
  {
    id: "location",
    icon: MapPin,
    options: ["all", "hcm-q7", "hcm-bt", "hcm-td", "hn-cg", "hn-tx", "dn-hc"],
  },
  {
    id: "type",
    icon: LayoutGrid,
    options: ["all", "locker", "standard", "climate_controlled", "commercial"],
  },
  {
    id: "size",
    icon: Maximize2,
    options: ["all", "small", "medium", "large", "extra_large"],
  },
  {
    id: "price",
    icon: Tag,
    options: ["all", "under_1m", "1m_to_2m5", "2m5_to_5m", "above_5m"],
  },
] as const;

export type SearchFieldId = (typeof SEARCH_FIELDS)[number]["id"];

export const TRUST_INDICATORS = ["facilities", "sizes", "payment", "support"] as const;

export const BENEFIT_ITEMS: { id: string; icon: LucideIcon }[] = [
  { id: "security", icon: ShieldCheck },
  { id: "flexibility", icon: ThumbsUp },
  { id: "sizes", icon: Box },
  { id: "payment", icon: CreditCard },
  { id: "support", icon: Headphones },
];

export const STATISTIC_ITEMS: { id: string; icon: LucideIcon }[] = [
  { id: "facilities", icon: Building2 },
  { id: "units", icon: Layers },
  { id: "customers", icon: Users },
  { id: "safety", icon: ShieldCheck },
];

export const HOW_IT_WORKS_STEPS: { id: string; icon: LucideIcon }[] = [
  { id: "search", icon: Search },
  { id: "booking", icon: CalendarDays },
  { id: "payment", icon: CreditCard },
  { id: "pickup", icon: PackageCheck },
];

export type BillingCycle = "monthly" | "annual";

export const PRICING_PLANS = [
  { id: "small", monthlyPrice: 390000, annualPrice: 330000, isPopular: false },
  { id: "medium", monthlyPrice: 890000, annualPrice: 750000, isPopular: true },
  { id: "large", monthlyPrice: 1990000, annualPrice: 1690000, isPopular: false },
] as const;

export const TESTIMONIALS = [
  { id: "lan", avatar: "/images/landing/avatar-lan.jpg", rating: 5 },
  { id: "khoa", avatar: "/images/landing/avatar-khoa.jpg", rating: 5 },
  { id: "thu", avatar: "/images/landing/avatar-thu.jpg", rating: 4 },
] as const;

export const FOOTER_SERVICE_LINKS = [
  { id: "personal", href: `#${SEARCH_PANEL_ID}` },
  { id: "business", href: `#${SEARCH_PANEL_ID}` },
  { id: "climate", href: `#${SEARCH_PANEL_ID}` },
  { id: "locker", href: `#${SEARCH_PANEL_ID}` },
  { id: "moving", href: `#${SEARCH_PANEL_ID}` },
] as const;

// TODO: point faq / insurance / terms to their pages once they exist.
export const FOOTER_SUPPORT_LINKS = [
  { id: "faq", href: "#" },
  { id: "pricing", href: "#pricing" },
  { id: "guide", href: "#how-it-works" },
  { id: "insurance", href: "#" },
  { id: "terms", href: "#" },
] as const;

export const FOOTER_LEGAL_ITEMS = ["privacy", "regulations", "partnership"] as const;
