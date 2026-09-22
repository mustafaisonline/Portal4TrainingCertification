/** "Grace Hopper" → "GH"; a single word gives its first letter; blank → "?".
 *  Shared by the header avatar (AccountMenu) and the profile photo preview. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}
