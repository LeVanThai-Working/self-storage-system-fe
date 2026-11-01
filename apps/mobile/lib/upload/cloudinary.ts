import api from "@/lib/api/axios";
import {
  CloudinaryFolderEnum,
  type ApiResponse,
  type CloudinarySignatureRequest,
} from "@self-storage-system-fe/shared";

interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
}

/** A local image picked from the camera or library (expo-image-picker asset). */
export interface LocalImageFile {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  base64?: string | null;
}

/**
 * POST /upload/signature
 * Signed params are only `folder` and `timestamp`, so the client must not send anything else.
 */
async function getCloudinarySignature(folder: string): Promise<CloudinarySignatureResult> {
  const body: CloudinarySignatureRequest = { folder };
  const response = await api.post<ApiResponse<CloudinarySignatureResult>>(
    "/upload/signature",
    body
  );
  return response.data.data;
}

/** Uploads one local image straight to Cloudinary and returns its `secure_url`. */
export async function uploadImageToCloudinary(
  file: LocalImageFile,
  folder: CloudinaryFolderEnum | string = CloudinaryFolderEnum.GENERAL
): Promise<string> {
  const sig = await getCloudinarySignature(folder);

  const name = file.fileName || file.uri.split("/").pop() || `photo-${Date.now()}.jpg`;
  const type = file.mimeType || "image/jpeg";

  const formData = new FormData();

  if (file.base64) {
    // Cloudinary natively accepts Base64 Data URI strings.
    // This completely bypasses the React Native "Unsupported FormDataPart" error in modern Expo/RN runtimes.
    const dataUri = `data:${type};base64,${file.base64}`;
    formData.append("file", dataUri);
  } else {
    // If base64 is missing, attempt to convert local URI to a standard Blob via fetch
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append("file", blob, name);
    } catch {
      // Legacy React Native pseudo-blob object fallback
      formData.append("file", { uri: file.uri, name, type } as unknown as Blob);
    }
  }

  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  if (sig.folder) formData.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !json.secure_url) {
    throw new Error(json.error?.message || `Upload failed (HTTP ${res.status})`);
  }
  return json.secure_url;
}
