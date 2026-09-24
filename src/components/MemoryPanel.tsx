import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { AgentMemoryDto } from "../types";
import { formatDate, isWideScreen } from "../utils";
import { EmptyState } from "./EmptyState";
import { Pill } from "./Pill";

const SHOWN = 4;
const SUMMARY_SENTENCES = 2;

const STANCES: Record<string, string> = {
  support: "Supports",
  refine: "Wants to refine",
  oppose: "Opposes",
  challenge: "Challenges"
};

/** The summary is one long run of sentences; split it so the lead can stand alone. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function Summary({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const parts = sentences(text);
  const lead = parts.slice(0, SUMMARY_SENTENCES).join(" ");
  const rest = parts.slice(SUMMARY_SENTENCES);

  return (
    <div className="memory-summary">
      <p>{open ? parts.join(" ") : lead}</p>
      {rest.length > 0 ? (
        <button className="text-button" onClick={() => setOpen((value) => !value)} type="button">
          {open ? "Show less" : `Read the full summary (${rest.length} more sentences)`}
        </button>
      ) : null}
    </div>
  );
}

/**
 * One memory section. Every section is open on wide screens; on phones only
 * the first starts open so the tab does not run thousands of pixels long.
 */
function MemoryCard<T>({
  hint,
  items,
  keyOf,
  open,
  render,
  title
}: {
  hint: string;
  items: T[];
  keyOf: (item: T) => string;
  open: boolean;
  render: (item: T) => ReactNode;
  title: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const shown = expanded ? items : items.slice(0, SHOWN);

  return (
    <details className="memory-card" open={open}>
      <summary>
        <span>
          <strong>{title}</strong> <span className="muted small">{items.length}</span>
        </span>
        <ChevronDown aria-hidden="true" className="memory-chevron" size={16} />
      </summary>
      <div className="memory-card-body">
        <p className="muted small">{hint}</p>
        <ul>
          {shown.map((item, index) => (
            <li key={`${keyOf(item)}-${index}`}>{render(item)}</li>
          ))}
        </ul>
        {items.length > SHOWN ? (
          <button className="text-button" onClick={() => setExpanded((value) => !value)} type="button">
            {expanded ? "Show fewer" : `Show all ${items.length}`}
          </button>
        ) : null}
      </div>
    </details>
  );
}

const text = (item: string): string => item;

/**
 * An agent's public memory as plain sections: a short summary lead, then what
 * the agent believes, is asking, has done lately, is backing, and how it writes.
 */
export function MemoryPanel({ memory }: { memory?: AgentMemoryDto }) {
  if (!memory) return <EmptyState text="This agent has no public memory yet." />;

  const hasSections =
    memory.beliefs.length +
      memory.openQuestions.length +
      memory.recentHighlights.length +
      memory.styleNotes.length +
      memory.activeIdeas.length >
    0;
  if (!memory.summary && !hasSections) return <EmptyState text="This agent has no public memory yet." />;
  const wide = isWideScreen();

  return (
    <div className="memory">
      <div className="section-title-row">
        <h3>Public memory</h3>
        {memory.lastCompressedAt ? (
          <span className="muted small">Updated {formatDate(memory.lastCompressedAt)}</span>
        ) : null}
      </div>

      {memory.summary ? <Summary text={memory.summary} /> : null}

      <div className="memory-grid">
        <MemoryCard hint="Positions the agent holds." items={memory.beliefs} keyOf={text} open render={text} title="Beliefs" />
        <MemoryCard
          hint="Things the agent is still working out."
          items={memory.openQuestions}
          keyOf={text}
          open={wide}
          render={text}
          title="Open questions"
        />
        <MemoryCard
          hint="What the agent has been part of lately."
          items={memory.recentHighlights}
          keyOf={text}
          open={wide}
          render={text}
          title="Recently"
        />
        <MemoryCard
          hint="Shared ideas the agent has taken a side on."
          items={memory.activeIdeas}
          keyOf={(idea) => idea.ideaId}
          open={wide}
          render={(idea) => (
            <>
              <Pill>{STANCES[idea.stance] ?? idea.stance}</Pill> {idea.label}
            </>
          )}
          title="Ideas in play"
        />
        <MemoryCard
          hint="How the agent tends to come across."
          items={memory.styleNotes}
          keyOf={text}
          open={wide}
          render={text}
          title="Voice"
        />
      </div>
    </div>
  );
}
