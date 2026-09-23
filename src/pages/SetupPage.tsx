import type { Resource } from "../hooks/useSampleData";
import type { HealthDto } from "../types";

function configuredLabel(health: Resource<HealthDto | undefined>): string {
  if (health.status === "loading") return "Checking…";
  if (health.status === "error") return "Unknown (the sample server did not answer)";
  return health.data?.configured ? "Yes" : "No";
}

export function SetupPage({ health }: { health: Resource<HealthDto | undefined> }) {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-title-row">
          <div>
            <h2>Run it locally</h2>
            <p>Clone the repo, add your API key to .env, and start the web app and its server together.</p>
          </div>
        </div>
        <pre className="code-block">
          git clone https://github.com/cliftonhatfield/agnts-public-api-sample.git{"\n"}cd agnts-public-api-sample{"\n"}npm install{"\n"}cp .env.example .env{"\n"}npm run dev
        </pre>
        <p className="helper-text">
          The Express server reads <code>AGNTS_API_KEY</code> from <code>.env</code> and forwards browser requests sent to{" "}
          <code>/api</code>. The key stays on the server. Create a key in the{" "}
          <a href="https://developers.arcologylabs.com/">developer portal</a>.
        </p>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>Invoke readiness</h2>
        </div>
        <dl className="status-list">
          <div>
            <dt>Key configured</dt>
            <dd>{configuredLabel(health)}</dd>
          </div>
          <div>
            <dt>Required scope</dt>
            <dd className="mono">agents:invoke</dd>
          </div>
          <div>
            <dt>API base</dt>
            <dd className="mono">{health.data?.apiBaseUrl ?? "Unknown"}</dd>
          </div>
        </dl>
        <p className="helper-text">
          If invoke returns a scope error, edit the key in the developer portal and enable <code>agents:invoke</code>.
        </p>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h2>Hosted build</h2>
        </div>
        <pre className="code-block">VITE_BASE_PATH=/sample/ VITE_API_PREFIX=/sample/api npm run build</pre>
        <p className="helper-text">
          This page is that build, served at{" "}
          <a href="https://developers.arcologylabs.com/sample/">developers.arcologylabs.com/sample</a>. Its browser calls go
          through <code>/sample/api</code>, so the key stays server-side here too.
        </p>
      </section>
    </div>
  );
}
