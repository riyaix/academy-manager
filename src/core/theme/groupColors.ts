/** Semantic group calendar colors — CSS vars defined in index.css for light/dark. */

export const GROUP_COLOR_TOKENS = [
  "group-1",
  "group-2",
  "group-3",
  "group-4",
  "group-5",
  "group-6",
] as const;

export type GroupColorToken = (typeof GROUP_COLOR_TOKENS)[number];

/** Tailwind class that paints a group chip / calendar block. */
export function groupColorClass(token: GroupColorToken | string): string {
  if (GROUP_COLOR_TOKENS.includes(token as GroupColorToken)) {
    return `bg-[var(--color-${token})]`;
  }
  return `bg-[var(--color-group-1)]`;
}

export const GROUP_COLOR_PALETTE = GROUP_COLOR_TOKENS.map(groupColorClass);

const LEGACY_CLASS_TO_TOKEN: Record<string, GroupColorToken> = {
  "bg-blue-500": "group-1",
  "bg-blue-600": "group-1",
  "bg-sky-500": "group-1",
  "bg-cyan-500": "group-1",
  "bg-teal-500": "group-1",
  "bg-emerald-500": "group-2",
  "bg-green-500": "group-2",
  "bg-green-600": "group-2",
  "bg-lime-500": "group-2",
  "bg-orange-500": "group-3",
  "bg-amber-500": "group-3",
  "bg-yellow-500": "group-3",
  "bg-pink-500": "group-4",
  "bg-rose-500": "group-4",
  "bg-red-500": "group-4",
  "bg-violet-500": "group-5",
  "bg-purple-500": "group-5",
  "bg-fuchsia-500": "group-5",
  "bg-indigo-500": "group-6",
  "bg-indigo-600": "group-6",
  // Broken leftovers from prior Tailwind→token rewrites
  "bg-[var(--color-info-surface)]0": "group-1",
  "bg-[var(--color-success-surface)]0": "group-2",
};

export function isHexColor(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("#"));
}

/** Resolve stored group color (legacy Tailwind class, token class, or hex) to a bg class. */
export function resolveGroupColorClass(stored: string | null | undefined): string {
  if (!stored || isHexColor(stored)) return groupColorClass("group-1");
  if (GROUP_COLOR_PALETTE.includes(stored)) return stored;
  const token = LEGACY_CLASS_TO_TOKEN[stored];
  if (token) return groupColorClass(token);
  // Already a var() class or unknown — fall back
  if (stored.includes("--color-group-")) return stored;
  return groupColorClass("group-1");
}

export function groupColorInlineStyle(
  stored: string | null | undefined,
): { backgroundColor: string } | undefined {
  if (isHexColor(stored)) return { backgroundColor: stored as string };
  return undefined;
}
