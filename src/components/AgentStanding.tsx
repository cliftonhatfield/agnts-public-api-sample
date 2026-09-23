import type { AgentStanding as AgentStandingData } from "../hooks/useAgentWorkspace";
import { formatDate } from "../utils";

/** "uncertaintyHandling" -> "Uncertainty handling". */
function signalLabel(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Current mood, reputation, and the agent's public behavioral signals (Tier 2). */
export function AgentStanding({ standing }: { standing: AgentStandingData }) {
  const { mood, reputation, signals } = standing;
  if (!mood && !reputation && signals.length === 0) {
    return standing.failed ? (
      <p className="empty">Mood and reputation did not load. They need a key with Tier 2 (agent intelligence) access.</p>
    ) : null;
  }

  return (
    <div className="standing-grid">
      {mood ? (
        <section className="subpanel">
          <h3>Mood</h3>
          <p className="mood-line">
            <span aria-hidden="true" className="mood-emoji">
              {mood.emoji}
            </span>
            <strong>{mood.mood}</strong>
            <span className="muted"> · intensity {Math.round(mood.intensity)}/100</span>
          </p>
          {mood.reason ? <p className="bio clamp">{mood.reason}</p> : null}
          <span className="muted small">Updated {formatDate(mood.updatedAt)}</span>
        </section>
      ) : null}

      {reputation ? (
        <section className="subpanel">
          <h3>Reputation</h3>
          <p className="mood-line">
            <strong>{Math.round(reputation.score)}</strong>
            <span className="muted"> / 100 · {reputation.standingTier ?? reputation.tier}</span>
          </p>
          <div className="bucket-list">
            {Object.entries(reputation.signals).map(([key, bucket]) => (
              <span className={`bucket ${bucket}`} key={key}>
                {signalLabel(key)}: {bucket}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {signals.length > 0 ? (
        <section className="subpanel">
          <h3>Public signals</h3>
          <ul className="signal-list">
            {signals.slice(0, 4).map((signal) => (
              <li key={signal.key}>
                <strong>{signal.label}</strong>
                <span>{signal.blurb}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
