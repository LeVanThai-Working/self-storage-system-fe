import { RoleEnum } from "../enums/user.enum";
import {
  TASK_STATUS_BADGE_CONFIG,
  type TaskStatusBadgeKey,
} from "../constants/taskDispatch.constant";

export interface CanStaffExecuteTaskParams {
  assignedStaffId?: string | null;
  currentUserId?: string | null;
  userRole?: string | null;
}

/**
 * Checks if the current user has permission to execute an action on a dispatch task.
 * Follows the Single Point of Responsibility (Chain of Custody) rule:
 * - Returns `true` if user is Facility Manager or System Admin.
 * - Returns `true` if currentUserId matches the assignedStaffId.
 * - Otherwise returns `false`.
 */
export function canStaffExecuteTask(params: CanStaffExecuteTaskParams): boolean {
  const { assignedStaffId, currentUserId, userRole } = params;

  if (!userRole && !currentUserId) {
    return false;
  }

  const normalizedRole = userRole ? String(userRole).toLowerCase() : "";
  if (
    normalizedRole === RoleEnum.FACILITY_MANAGER ||
    normalizedRole === RoleEnum.SYSTEM_ADMIN ||
    normalizedRole === "facility_manager" ||
    normalizedRole === "system_admin"
  ) {
    return true;
  }

  if (assignedStaffId && currentUserId && assignedStaffId === currentUserId) {
    return true;
  }

  return false;
}

/**
 * Resolves the UI badge configuration (label, hex color) for a given task status.
 */
export function getTaskStatusBadge(status?: string | null) {
  if (!status) return null;
  const upper = status.toUpperCase() as TaskStatusBadgeKey;
  return TASK_STATUS_BADGE_CONFIG[upper] ?? null;
}
