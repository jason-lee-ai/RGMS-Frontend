import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../api/client";
import type { DashboardSummary } from "../types";

export function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => apiGet<DashboardSummary>("/api/dashboard/summary"),
  });

  if (isLoading) {
    return <p className="muted">Loading dashboard…</p>;
  }

  if (isError) {
    return (
      <p className="error">
        Failed to load dashboard: {(error as Error).message}
      </p>
    );
  }

  if (!data) return null;
  const maxEnglish = Math.max(1, ...data.planProgress.map((p) => (p.english > 0 ? p.english : 0)));
  const maxSpanish = Math.max(1, ...data.planProgress.map((p) => (p.spanish > 0 ? p.spanish : 0)));
  const maxJapanese = Math.max(1, ...data.planProgress.map((p) => (p.japanese > 0 ? p.japanese : 0)));

  function progressPercent(remaining: number, maxPositive: number) {
    if (remaining <= 0) return 100;
    const pct = ((maxPositive - remaining) / maxPositive) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  return (
    <div className="stack">
      <h1>Real guy hunting overview</h1>
      <p className="muted">
        Totals and breakdowns across sites and real guys in your database.
      </p>

      <div className="kpi-row">
        <div className="card kpi">
          <div className="kpi-label">Sites</div>
          <div className="kpi-value">{data.totalSites}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Real guys</div>
          <div className="kpi-value">{data.totalRealGuys}</div>
        </div>
      </div>

      <div className="grid-3">
        <section className="card">
          <h2>By type</h2>
          <ul className="list-plain">
            {data.byType.map((row) => (
              <li key={row.type}>
                <span className="tag">{row.type}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
            {data.byType.length === 0 && (
              <li className="muted">No data yet</li>
            )}
          </ul>
        </section>
        <section className="card">
          <h2>By status</h2>
          <ul className="list-plain">
            {data.byStatus.map((row) => (
              <li key={row.status}>
                <span className="tag">Status {row.status}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
            {data.byStatus.length === 0 && (
              <li className="muted">No data yet</li>
            )}
          </ul>
        </section>
        <section className="card">
          <h2>By country</h2>
          <ul className="list-plain">
            {data.byCountry.map((row) => (
              <li key={row.country}>
                <span>{row.country}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
            {data.byCountry.length === 0 && (
              <li className="muted">No data yet</li>
            )}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Daily plan progress</h2>
        {data.planProgress.length === 0 ? (
          <p className="muted">No plan data yet</p>
        ) : (
          <div className="plan-progress-list">
            {data.planProgress.map((p) => (
              <div key={`${p.date}`} className="plan-progress-row">
                <div className="plan-progress-date">{p.date.slice(0, 10)}</div>
                <div className="plan-progress-bars">
                  <div className="plan-bar-wrap">
                    <span className="plan-bar-label">EN {p.english}</span>
                    <div className="plan-bar-track">
                      <div
                        className="plan-bar plan-bar-en"
                        style={{ width: `${progressPercent(p.english, maxEnglish)}%` }}
                      />
                    </div>
                  </div>
                  <div className="plan-bar-wrap">
                    <span className="plan-bar-label">ES {p.spanish}</span>
                    <div className="plan-bar-track">
                      <div
                        className="plan-bar plan-bar-es"
                        style={{ width: `${progressPercent(p.spanish, maxSpanish)}%` }}
                      />
                    </div>
                  </div>
                  <div className="plan-bar-wrap">
                    <span className="plan-bar-label">JP {p.japanese}</span>
                    <div className="plan-bar-track">
                      <div
                        className="plan-bar plan-bar-jp"
                        style={{ width: `${progressPercent(p.japanese, maxJapanese)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
