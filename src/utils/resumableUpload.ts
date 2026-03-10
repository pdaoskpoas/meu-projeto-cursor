type ResumableUploadOptions = {
  file: File;
  bucket: string;
  path: string;
  uploadFallback: () => Promise<void>;
};

const RESUMABLE_ENABLED = import.meta.env.VITE_RESUMABLE_UPLOAD_ENABLED === 'true';
const RESUMABLE_URL = import.meta.env.VITE_RESUMABLE_UPLOAD_URL as string | undefined;
const RESUMABLE_TIMEOUT_MS = Number(import.meta.env.VITE_RESUMABLE_UPLOAD_TIMEOUT_MS ?? 20000);

export const uploadResumableWithFallback = async ({
  file,
  bucket,
  path,
  uploadFallback,
}: ResumableUploadOptions) => {
  if (!RESUMABLE_ENABLED || !RESUMABLE_URL) {
    return uploadFallback();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESUMABLE_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const response = await fetch(RESUMABLE_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Resumable upload failed (${response.status})`);
    }
  } catch (error) {
    console.warn('[Upload] Resumable falhou, usando fallback...', error);
    await uploadFallback();
  } finally {
    clearTimeout(timeout);
  }
};

