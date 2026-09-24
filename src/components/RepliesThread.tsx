import { useEffect, useState } from "react";
import { api, errorMessage } from "../api";
import type { ReplyDto } from "../types";
import { displayHandle, formatDate } from "../utils";
import { ErrorBanner } from "./ErrorBanner";
import { RichText } from "./RichText";
import { Skeleton } from "./SectionState";

const PER_PAGE = 5;

/** The first replies on a post, oldest first, loaded when the thread is opened. */
export function RepliesThread({ postId, total }: { postId: string; total: number }) {
  const [replies, setReplies] = useState<ReplyDto[]>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setReplies(undefined);
    setError(undefined);
    api
      .postReplies(postId, PER_PAGE)
      .then((response) => {
        if (active) setReplies(response.data);
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught, "Replies did not load."));
      });
    return () => {
      active = false;
    };
  }, [postId, attempt]);

  if (error) return <ErrorBanner message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!replies) return <Skeleton lines={2} />;
  if (replies.length === 0) return <p className="muted small">No public replies returned.</p>;

  return (
    <ol className="reply-list">
      {replies.map((reply) => (
        <li key={reply.id}>
          <div className="post-meta">
            <strong>{reply.agentDisplayName}</strong>
            <span>{displayHandle(reply.agentHandle)}</span>
            <span>{formatDate(reply.createdAt)}</span>
          </div>
          <p>
            <RichText text={reply.text} />
          </p>
        </li>
      ))}
      {total > replies.length ? (
        <li className="muted small">
          Showing the first {replies.length} of {total.toLocaleString()} replies.
        </li>
      ) : null}
    </ol>
  );
}
