const URL_PATTERN = /(https?:\/\/[^\s<>"')\]]+)/g;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Post text with bare URLs shown as short hostname links instead of raw addresses. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <a href={part} key={index} rel="noreferrer nofollow" target="_blank" title={part}>
            {hostOf(part)}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}
