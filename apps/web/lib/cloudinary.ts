import api from "@/lib/api/axios";
import {
  CloudinaryFolderEnum,
  type CloudinarySignatureRequest,
} from "@self-storage-system-fe/shared";

/**
 * Expected shape returned from BE for signature.
 */
export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
}

/**
 * Standard upload response from Cloudinary API.
 */
export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string;
  secure_url: string;
  original_filename: string;
  [key: string]: unknown;
}

export interface CloudinaryUploadOptions {
  folder?: CloudinaryFolderEnum | string;
  resourceType?: "image" | "raw" | "auto";
  onProgress?: (percent: number) => void;
}

/**
 * Fetch a signed upload signature from Backend API.
 * Endpoint: POST /upload/signature
 */
export async function getCloudinarySignature(
  folder: CloudinaryFolderEnum | string = CloudinaryFolderEnum.GENERAL
): Promise<CloudinarySignatureResult> {
  const reqBody: CloudinarySignatureRequest = { folder };

  const response = await api.post("/upload/signature", reqBody);

  const payload = response.data;
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data as CloudinarySignatureResult;
  }
  return payload as CloudinarySignatureResult;
}

/**
 * Upload a single file (image or document) directly to Cloudinary using Signed Upload.
 *
 * @param file Browser File object (from file input or drag-drop)
 * @param options Upload options (folder, resourceType, onProgress callback)
 * @returns CloudinaryUploadResponse with secure_url
 */
export async function uploadToCloudinaryWeb(
  file: File,
  options?: CloudinaryUploadOptions
): Promise<CloudinaryUploadResponse> {
  const folder = options?.folder || CloudinaryFolderEnum.GENERAL;

  // 1. Get signature from Backend
  const sigData = await getCloudinarySignature(folder);

  const cloudName =
    sigData.cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "nejsyiea";
  const apiKey = sigData.apiKey || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "211162624224893";

  if (!cloudName) {
    throw new Error("Missing Cloudinary Cloud Name");
  }

  // 2. Determine resource_type
  let resourceType: "image" | "raw" | "auto" = options?.resourceType || "auto";
  if (resourceType === "auto") {
    resourceType = file.type.startsWith("image/") ? "image" : "raw";
  }

  // 3. Build FormData with ONLY the signed parameters
  // IMPORTANT: Cloudinary will reject with 'Invalid Signature' if parameters not included in signature are sent
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(sigData.timestamp));
  formData.append("signature", sigData.signature);
  if (sigData.folder) {
    formData.append("folder", sigData.folder);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  // 4. Perform upload with XMLHttpRequest (to support onProgress percentage)
  return new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    if (options?.onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resData: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(resData);
        } catch {
          reject(new Error("Không thể phân tích phản hồi từ Cloudinary"));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(
            new Error(errData.error?.message || `Upload thất bại với mã lỗi HTTP ${xhr.status}`)
          );
        } catch {
          reject(new Error(`Upload thất bại với mã lỗi HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Lỗi mạng khi kết nối tới Cloudinary"));
    };

    xhr.send(formData);
  });
}

/**
 * Helper to upload multiple files in parallel and return list of secure URLs.
 */
export async function uploadMultipleToCloudinaryWeb(
  files: File[],
  options?: CloudinaryUploadOptions
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadToCloudinaryWeb(file, options));
  const results = await Promise.all(uploadPromises);
  return results.map((item) => item.secure_url);
}
