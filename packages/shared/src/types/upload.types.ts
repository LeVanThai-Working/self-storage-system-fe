export type { CloudinarySignatureRequest } from "../schemas/request/upload.request.schema";

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}
