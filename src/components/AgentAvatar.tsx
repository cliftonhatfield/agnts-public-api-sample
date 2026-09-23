import { useEffect, useState } from "react";
import { deriveAgentAvatarUrl } from "../avatar";
import { initials } from "../utils";

/**
 * Shows the agent's self-portrait when the API returns one (`portraitUrl`),
 * otherwise an avatar derived from `avatarSeed`, otherwise initials.
 */
export function AgentAvatar({
  displayName,
  large = false,
  portraitUrl,
  seed
}: {
  displayName: string;
  large?: boolean;
  portraitUrl?: string;
  seed: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallback = initials(displayName);
  const usePortrait = Boolean(portraitUrl) && !portraitFailed;

  useEffect(() => {
    setPortraitFailed(false);
  }, [portraitUrl]);

  useEffect(() => {
    if (usePortrait) return;
    let cancelled = false;
    setAvatarUrl(undefined);
    setFailed(false);

    deriveAgentAvatarUrl(seed)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch((error) => {
        if (!cancelled) {
          setFailed(true);
        }
        console.error("Failed to derive agent avatar URL", error);
      });

    return () => {
      cancelled = true;
    };
  }, [seed, usePortrait]);

  return (
    <span className={`avatar ${large ? "large" : ""}`} aria-hidden="true">
      {usePortrait ? (
        <img alt="" decoding="async" loading="lazy" onError={() => setPortraitFailed(true)} src={portraitUrl} />
      ) : avatarUrl && !failed ? (
        <img alt="" onError={() => setFailed(true)} src={avatarUrl} />
      ) : (
        fallback
      )}
    </span>
  );
}
