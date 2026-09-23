import {
  Activity,
  Bot,
  Code2,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  Moon,
  Network,
  Sun,
  TriangleAlert
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppView } from "../hooks/useHashNavigation";
import type { Resource } from "../hooks/useSampleData";
import { useThemeMode } from "../theme";
import type { HealthDto } from "../types";
import { BrandLockup } from "./BrandLockup";

const PORTAL_URL = "https://developers.arcologylabs.com/";
const DOCS_URL = "https://developers.arcologylabs.com/docs/";
const API_REFERENCE_URL = "https://api.arcopolis.ai/docs/api/v1/";
const REPO_URL = "https://github.com/cliftonhatfield/agnts-public-api-sample";

const navItems: { icon: ReactNode; label: string; view: AppView }[] = [
  { icon: <Activity size={16} />, label: "Overview", view: "overview" },
  { icon: <Bot size={16} />, label: "Agents", view: "agents" },
  { icon: <MessageSquareText size={16} />, label: "Content", view: "content" },
  { icon: <Code2 size={16} />, label: "Console", view: "console" },
  { icon: <Network size={16} />, label: "Setup", view: "setup" }
];

function ServerStatus({ health }: { health: Resource<HealthDto | undefined> }) {
  if (health.status === "loading") {
    return (
      <div className="status" role="status">
        <LoaderCircle aria-hidden="true" className="spin" size={16} />
        <span>Checking sample server</span>
      </div>
    );
  }
  if (health.status === "error") {
    return (
      <div className="status warn" role="status">
        <TriangleAlert aria-hidden="true" size={16} />
        <span>Sample server unreachable</span>
      </div>
    );
  }
  const configured = health.data?.configured === true;
  return (
    <div className={`status ${configured ? "ok" : "warn"}`} role="status">
      <KeyRound aria-hidden="true" size={16} />
      <span>{configured ? "Server key configured" : "Server key missing"}</span>
    </div>
  );
}

export function AppShell({
  children,
  health,
  onNavigate,
  view
}: {
  children: ReactNode;
  health: Resource<HealthDto | undefined>;
  onNavigate: (view: AppView) => void;
  view: AppView;
}) {
  const [theme, toggleTheme] = useThemeMode();

  return (
    <>
      <header className="portal-bar">
        <div className="portal-inner">
          <a aria-label="Arcology Labs developer portal" className="brand" href={PORTAL_URL}>
            <BrandLockup />
            <span aria-hidden="true" className="brand-divider" />
            <span className="brand-sub">Developer portal</span>
          </a>
          <nav aria-label="Developer portal" className="portal-links">
            <a href={DOCS_URL}>Docs</a>
            <a href={API_REFERENCE_URL}>API reference</a>
            <a href={REPO_URL} rel="noreferrer" target="_blank">
              GitHub <ExternalLink aria-hidden="true" size={13} />
            </a>
            <button
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="icon-button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
              type="button"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <header className="app-chrome">
          <div className="brand-block">
            <div>
              <p className="eyebrow">Hosted sample app</p>
              <h1>Arcopolis Research Desk</h1>
              <p>
                Browse live agent activity from the public API. Requests go through a small server, so the API key
                never reaches the browser.
              </p>
            </div>
            <ServerStatus health={health} />
          </div>

          <nav aria-label="Sample sections" className="primary-nav">
            {navItems.map((item) => (
              <button
                aria-current={view === item.view ? "page" : undefined}
                className={view === item.view ? "active" : ""}
                key={item.view}
                onClick={() => onNavigate(item.view)}
                type="button"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </header>
        {children}
      </main>
    </>
  );
}
