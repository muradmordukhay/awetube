/**
 * TUS resumable upload helper for Qencode.
 *
 * Wraps tus-js-client into a promise-based API that the upload page can
 * consume. Returns a `tus:<file_uuid>` URI for use with start-transcode.
 *
 * Qencode TUS endpoint format: `${upload_url}/${task_token}`
 * After upload the Location header contains the file UUID as the last
 * path segment, which we prefix with "tus:" per Qencode convention.
 */
import * as tus from "tus-js-client";

export type TusUploadOptions = {
  file: File;
  uploadUrl: string;
  taskToken: string;
  onProgress: (percent: number) => void;
};

export type TusUploadResult = {
  tusUri: string;
};

const CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB

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
      chunkSize: CHUNK_SIZE,
      retryDelays: [0, 1000, 3000, 5000],
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

        // Extract file UUID from the last path segment of the Location URL
        // e.g. "https://storage.qencode.com/v1/upload_file/<token>/<uuid>"
        try {
          const parsed = new URL(url);
          const segments = parsed.pathname.split("/").filter(Boolean);
          const fileUuid = segments[segments.length - 1];
          if (!fileUuid) {
            reject(new Error("Could not extract file UUID from upload URL"));
            return;
          }
          resolve({ tusUri: `tus:${fileUuid}` });
        } catch {
          // Fallback: split on "/" if URL parsing fails
          const fileUuid = url.split("/").pop();
          if (!fileUuid) {
            reject(new Error("Could not extract file UUID from upload URL"));
            return;
          }
          resolve({ tusUri: `tus:${fileUuid}` });
        }
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
