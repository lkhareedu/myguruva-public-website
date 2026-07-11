/** Strip markdown emphasis and collapse whitespace for card teasers. */
export function plainText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short teaser with hard ellipsis (line-clamp alone fails on long tokens). */
export function teaser(input: string | null | undefined, max = 110): string {
  const text = plainText(input);
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}
