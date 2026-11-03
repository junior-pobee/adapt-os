export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_VAULT_SIZE_BYTES = 100 * 1024 * 1024;

export const validateUploadBatch = (files: readonly { size: number; name: string }[], currentBytes: number) => {
  if (files.some(file => file.size > MAX_FILE_SIZE_BYTES)) return "Each file must be 20 MB or smaller.";
  const incoming = files.reduce((total, file) => total + file.size, 0);
  if (currentBytes + incoming > MAX_VAULT_SIZE_BYTES) return "The File Vault limit is 100 MB on this device. Download or remove files before adding more.";
  return null;
};

export const normalizeExternalUrl = (value: string) => {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};
