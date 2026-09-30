import type { MessageCode } from "../constants/messageCode";

/**
 * Standard error response structure from the Backend API.
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  messageCode: MessageCode | string;
  message: string;
  errors?: unknown;
  path: string;
  timestamp: string;
  stack?: string;
}

/**
 * Standard success response structure from the Backend API.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  messageCode: MessageCode | string;
  message: string;
  data: T;
  timestamp?: string;
}
