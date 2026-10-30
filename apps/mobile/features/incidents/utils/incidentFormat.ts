import {
  Building2,
  CircleHelp,
  Droplets,
  ShieldAlert,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import {
  IncidentCategoryEnum,
  IncidentSeverityEnum,
  IncidentStatusEnum,
} from "@self-storage-system-fe/shared";
import type { StatusTone } from "@/components/ui/status-pill";

export const INCIDENT_CATEGORY_ICON: Record<IncidentCategoryEnum, LucideIcon> = {
  [IncidentCategoryEnum.STRUCTURAL]: Building2,
  [IncidentCategoryEnum.ELECTRICAL]: Zap,
  [IncidentCategoryEnum.WATER_LEAK]: Droplets,
  [IncidentCategoryEnum.SECURITY]: ShieldAlert,
  [IncidentCategoryEnum.CLEANLINESS]: Sparkles,
  [IncidentCategoryEnum.FACILITY_DAMAGE]: Building2,
  [IncidentCategoryEnum.EQUIPMENT_FAILURE]: Zap,
  [IncidentCategoryEnum.FIRE_WATER]: Droplets,
  [IncidentCategoryEnum.SECURITY_BREACH]: ShieldAlert,
  [IncidentCategoryEnum.NATURAL_DISASTER]: Droplets,
  [IncidentCategoryEnum.POWER_OUTAGE]: Zap,
  [IncidentCategoryEnum.OTHER]: CircleHelp,
};

export const INCIDENT_STATUS_TONE: Record<IncidentStatusEnum, StatusTone> = {
  [IncidentStatusEnum.REPORTED]: "yellow",
  [IncidentStatusEnum.ASSIGNED]: "blue",
  [IncidentStatusEnum.INVESTIGATING]: "blue",
  [IncidentStatusEnum.IN_PROGRESS]: "purple",
  [IncidentStatusEnum.RESOLVED]: "green",
  [IncidentStatusEnum.CLOSED]: "gray",
  [IncidentStatusEnum.CANCELLED]: "gray",
};

export const INCIDENT_SEVERITY_TONE: Record<IncidentSeverityEnum, StatusTone> = {
  [IncidentSeverityEnum.LOW]: "gray",
  [IncidentSeverityEnum.MEDIUM]: "yellow",
  [IncidentSeverityEnum.HIGH]: "orange",
  [IncidentSeverityEnum.CRITICAL]: "red",
};

/** The 5-step customer-facing stepper (I2); `in_progress` has no API yet, so it maps to step 3. */
export const INCIDENT_STEPS = [
  "reported",
  "assigned",
  "investigating",
  "resolved",
  "closed",
] as const;

export function getIncidentStepIndex(status: IncidentStatusEnum): number {
  switch (status) {
    case IncidentStatusEnum.REPORTED:
      return 0;
    case IncidentStatusEnum.ASSIGNED:
      return 1;
    case IncidentStatusEnum.INVESTIGATING:
    case IncidentStatusEnum.IN_PROGRESS:
      return 2;
    case IncidentStatusEnum.RESOLVED:
      return 3;
    case IncidentStatusEnum.CLOSED:
      return 4;
    default:
      return -1;
  }
}
