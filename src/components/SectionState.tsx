import type { ReactNode } from "react";
import type { Resource } from "../hooks/useSampleData";
import { ErrorBanner } from "./ErrorBanner";

/**
 * Renders a section's loading placeholder or error, and its content once the
 * resource is ready. Stale data stays visible while a retry is in flight.
 */
export function SectionState<T>({
  children,
  lines = 3,
  onRetry,
  resource
}: {
  children: (data: T) => ReactNode;
  lines?: number;
  onRetry: () => void;
  resource: Resource<T>;
}) {
  if (resource.status === "error") {
    return <ErrorBanner message={resource.error ?? "This section could not load."} onRetry={onRetry} />;
  }
  // A section with nothing to show yet gets a placeholder; one that already has data keeps it.
  const empty = resource.data === undefined || (Array.isArray(resource.data) && resource.data.length === 0);
  if (resource.status === "loading" && empty) {
    return <Skeleton lines={lines} />;
  }
  return <>{children(resource.data)}</>;
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="skeleton" role="status">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
