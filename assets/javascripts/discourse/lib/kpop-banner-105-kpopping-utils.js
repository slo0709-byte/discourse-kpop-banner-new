export function normalizeKpoppingThumbnail(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw, window.location.origin);
    const nested = parsed.searchParams.get("url");
    if (nested) {
      return decodeURIComponent(nested);
    }
  } catch {
    return raw;
  }

  return raw;
}
