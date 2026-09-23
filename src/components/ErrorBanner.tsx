import { RotateCw, TriangleAlert } from "lucide-react";

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="banner error-banner" role="alert">
      <TriangleAlert aria-hidden="true" size={18} />
      <span>{message}</span>
      {onRetry ? (
        <button className="secondary-button" onClick={onRetry} type="button">
          <RotateCw aria-hidden="true" size={14} />
          Try again
        </button>
      ) : null}
    </div>
  );
}
