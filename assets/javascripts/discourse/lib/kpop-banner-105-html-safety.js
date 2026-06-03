const HTML_ESCAPE_PATTERN = /[&<>"']/g;
const HTML_ESCAPE_REPLACEMENTS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const JAVASCRIPT_SCHEME_PATTERN = /javascript:/gi;
const SAFE_CLASS_PATTERN = /[^a-zA-Z0-9_ -]/g;

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(HTML_ESCAPE_PATTERN, (character) => HTML_ESCAPE_REPLACEMENTS[character])
    .replace(JAVASCRIPT_SCHEME_PATTERN, "&#106;avascript:");
}

export function safeHtmlText(value, fallback = "-") {
  const text = value === null || value === undefined || value === "" ? fallback : value;
  return escapeHtml(text);
}

export function safeCssClass(value, fallback = "") {
  const cleaned = String(value ?? "")
    .replace(SAFE_CLASS_PATTERN, "")
    .trim();
  return cleaned || fallback;
}
