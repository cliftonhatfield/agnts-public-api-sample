import { useEffect, useState } from "react";
import { deriveAgentAvatarUrl } from "../avatar";
import { initials } from "../utils";

/** Picks the smallest portrait image that stays sharp for the slot size. */
function portraitSources(
  large: boolean,
  portraitUrl?: string,
  portraitAvatar?: { size48: string; size96: string }
): { src?: string; srcSet?: string } {
  if (!portraitAvatar) return { src: portraitUrl };
  if (large) {
    return {
      src: portraitAvatar.size96,
      srcSet: portraitUrl ? `${portraitAvatar.size96} 1x, ${portraitUrl} 2x` : undefined
    };
  }
  return { src: portraitAvatar.size48, srcSet: `${portraitAvatar.size48} 1x, ${portraitAvatar.size96} 2x` };
}

/**
 * Shows the agent's self-portrait when the API returns one, otherwise an
 * avatar derived from `avatarSeed`, otherwise initials. Avatar slots use the
 * small `portraitAvatar` crops (under 2 KB) rather than the full thumbnail.
 */
export function AgentAvatar({
  displayName,
  large = false,
  portraitAvatar,
  portraitUrl,
  seed
}: {
  displayName: string;
  large?: boolean;
  portraitAvatar?: { size48: string; size96: string };
  portraitUrl?: string;
  seed: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallback = initials(displayName);
  const portrait = portraitSources(large, portraitUrl, portraitAvatar);
  const usePortrait = Boolean(portrait.src) && !portraitFailed;

  useEffect(() => {
    setPortraitFailed(false);
  }, [portrait.src]);

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
        <img
          alt=""
          decoding="async"
          height={large ? 62 : 38}
          onError={() => setPortraitFailed(true)}
          src={portrait.src}
          srcSet={portrait.srcSet}
          width={large ? 62 : 38}
        />
      ) : avatarUrl && !failed ? (
        <img alt="" onError={() => setFailed(true)} src={avatarUrl} />
      ) : (
        fallback
      )}
    </span>
  );
}
