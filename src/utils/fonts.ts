export const GOOGLE_SANS_FLEX_FONT_FAMILY = '"Google Sans Flex", sans-serif';

export const DEFAULT_UI_FONT_FAMILY = GOOGLE_SANS_FLEX_FONT_FAMILY;

export const DEFAULT_CODE_FONT_FAMILY = GOOGLE_SANS_FLEX_FONT_FAMILY;

const LEGACY_DEFAULT_UI_FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const LEGACY_DEFAULT_CODE_FONT_FAMILY =
  'ui-monospace, "Cascadia Mono", "Segoe UI Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const LEGACY_DEFAULT_FONT_FAMILY_NORMALIZED = new Set(
  [LEGACY_DEFAULT_UI_FONT_FAMILY, LEGACY_DEFAULT_CODE_FONT_FAMILY].map(
    normalizeComparableFontFamily,
  ),
);

export const CODE_FONT_SIZE_DEFAULT = 11;
export const CODE_FONT_SIZE_MIN = 9;
export const CODE_FONT_SIZE_MAX = 16;

export function normalizeFontFamily(
  value: string | null | undefined,
  fallback: string,
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  if (LEGACY_DEFAULT_FONT_FAMILY_NORMALIZED.has(normalizeComparableFontFamily(trimmed))) {
    return fallback;
  }
  return trimmed;
}

export function clampCodeFontSize(value: number) {
  if (!Number.isFinite(value)) {
    return CODE_FONT_SIZE_DEFAULT;
  }
  return Math.min(CODE_FONT_SIZE_MAX, Math.max(CODE_FONT_SIZE_MIN, value));
}

function normalizeComparableFontFamily(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
