/**
 * TUS resumable upload helper for Qencode.
 *
 * Wraps tus-js-client into a promise-based API that the upload page can
 * consume. Returns a `tus:<file_uuid>` URI for use with start-transcode.
 *
 * Qencode TUS endpoint format: `${upload_url}/${task_token}`
 * After upload, the Location header contains the file UUID as the last
 * path segment: `https://storage.qencode.com/v1/upload_file/<token>/<uuid>`
 * We prefix it with "tus:" per Qencode convention.
 */
import * as tus from "tus-js-client";
import { UPLOAD } from "@/lib/constants";

export type TusUploadOptions = {
  file: File;
  uploadUrl: string;
  taskToken: string;
  onProgress: (percent: number) => void;
};

export type TusUploadResult = {
  /** File URI in format "tus:{fileUuid}" as returned by Qencode TUS upload. */
  tusUri: string;
};

/**
 * Extracts the file UUID from the TUS Location URL returned by Qencode.
 *
 * Expected format: `https://storage.qencode.com/v1/upload_file/<token>/<uuid>`
 * Returns `tus:<uuid>` on success, or null if the UUID cannot be determined.
 */
export function extractUuidFromTusLocation(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const uuid = segments[segments.length - 1];
    return uuid ? `tus:${uuid}` : null;
  } catch {
    // Fallback for non-standard URL formats
    const uuid = url.split("/").pop();
    return uuid ? `tus:${uuid}` : null;
  }
}

export function uploadFileViaTus({
  file,
  uploadUrl,
  taskToken,
  onProgress,
}: TusUploadOptions): { promise: Promise<TusUploadResult>; abort: () => void } {
  let abortFn: () => void = () => {};

  const promise = new Promise<TusUploadResult>((resolve, reject) => {
    const endpoint = `${uploadUrl.replace(/\/$/, "")}/${taskToken}`;

    const upload = new tus.Upload(file, {
      endpoint,
      chunkSize: UPLOAD.CHUNK_SIZE,
      retryDelays: UPLOAD.RETRY_DELAYS,
      metadata: {
        filename: file.name,
        filetype: file.type,
      },

      onProgress(bytesSent: number, bytesTotal: number) {
        const percent = Math.round((bytesSent / bytesTotal) * 100);
        onProgress(percent);
      },

      onSuccess() {
        const url = upload.url;
        if (!url) {
          reject(new Error("Upload succeeded but no URL was returned"));
          return;
        }

        const tusUri = extractUuidFromTusLocation(url);
        if (!tusUri) {
          reject(new Error("Could not extract file UUID from upload URL"));
          return;
        }

        resolve({ tusUri });
      },

      onError(error: Error) {
        reject(new Error(`Upload failed: ${error.message}`));
      },
    });

    abortFn = () => upload.abort();
    upload.start();
  });

  return { promise, abort: abortFn };
}
