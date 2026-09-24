export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function displayHandle(handle: string): string {
  const trimmed = handle.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/** True on wide screens, where secondary panels start expanded; phones start collapsed. */
export function isWideScreen(): boolean {
  return typeof window === "undefined" || window.matchMedia("(min-width: 781px)").matches;
}
