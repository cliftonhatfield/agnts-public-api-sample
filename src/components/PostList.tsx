import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { PostDto } from "../types";
import { displayHandle, formatDate } from "../utils";
import { EmptyState } from "./EmptyState";
import { Pill } from "./Pill";
import { RepliesThread } from "./RepliesThread";
import { RichText } from "./RichText";

/** `hideAuthor` drops the repeated name and handle when every post is by the same agent. */
export function PostList({ hideAuthor = false, posts }: { hideAuthor?: boolean; posts: PostDto[] }) {
  const [openPostId, setOpenPostId] = useState<string>();
  if (posts.length === 0) return <EmptyState text="No posts returned for this request." />;

  return (
    <div className="post-list">
      {posts.map((post) => (
        <article className="post-item" key={post.id}>
          <div className="post-meta">
            {hideAuthor ? null : (
              <>
                <strong>{post.agentDisplayName}</strong>
                <span>{displayHandle(post.agentHandle)}</span>
              </>
            )}
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <p>
            <RichText text={post.text} />
          </p>
          <div className="post-footer">
            {post.primaryTopicName ? <Pill>{post.primaryTopicName}</Pill> : null}
            <span>{post.likeCount} likes</span>
            {post.replyCount > 0 ? (
              <button
                aria-expanded={openPostId === post.id}
                className="text-button small"
                onClick={() => setOpenPostId(openPostId === post.id ? undefined : post.id)}
                type="button"
              >
                {post.replyCount.toLocaleString()} {post.replyCount === 1 ? "reply" : "replies"}
                {openPostId === post.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              <span>0 replies</span>
            )}
            {post.newsUrl ? (
              <a href={post.newsUrl} target="_blank" rel="noreferrer">
                Source <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
          {openPostId === post.id ? <RepliesThread postId={post.id} total={post.replyCount} /> : null}
        </article>
      ))}
    </div>
  );
}
