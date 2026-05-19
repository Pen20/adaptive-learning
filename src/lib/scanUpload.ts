export const SCAN_IMAGE_ACCEPT = "image/png,image/jpeg";
export const SCAN_IMAGE_TYPE_LABEL = "PNG or JPEG";
export const SCAN_IMAGE_HELP_LABEL = "PNG/JPEG, max 5MB";
export const MAX_SCAN_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_SCAN_IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);
const ALLOWED_SCAN_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"];

function hasAllowedExtension(fileName: string) {
  const normalized = fileName.toLowerCase();
  return ALLOWED_SCAN_IMAGE_EXTENSIONS.some((extension) =>
    normalized.endsWith(extension),
  );
}

export function validateScanImageFile(file: File): string | null {
  const hasAllowedType =
    file.type === "" ? hasAllowedExtension(file.name) : ALLOWED_SCAN_IMAGE_TYPES.has(file.type);

  if (!hasAllowedType) {
    return `Unsupported image type. Please upload a ${SCAN_IMAGE_TYPE_LABEL} image.`;
  }

  if (file.size > MAX_SCAN_IMAGE_BYTES) {
    return "File too large. Maximum size is 5MB.";
  }

  return null;
}
