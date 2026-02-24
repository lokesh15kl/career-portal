import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { getAdminAnalytics } from "../services/api";
import { logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      // no-op
    }

    setLoggedIn(false);
    setRole("");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getAdminAnalytics();
        setData(result);
      } catch (loadError) {
        setError(loadError.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const categoryAttempts = useMemo(
    () => Object.entries(data?.attemptsByCategory || {}),
    [data]
  );
  const categoryAverages = useMemo(
    () => Object.entries(data?.averageByCategory || {}),
    [data]
  );
  const topUsers = useMemo(
    () => Object.entries(data?.topUsersByAttempts || {}),
    [data]
  );

  const maxAttempts = useMemo(
    () => Math.max(...categoryAttempts.map(([, value]) => Number(value)), 1),
    [categoryAttempts]
  );

  const maxAverage = useMemo(
    () => Math.max(...categoryAverages.map(([, value]) => Number(value)), 1),
    [categoryAverages]
  );

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-identity">
          <div className="admin-avatar" aria-hidden="true">A</div>
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage assessments and career data</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle />
          <button onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <nav className="admin-nav-pills" aria-label="Admin navigation">
          <Link to="/admin" className="admin-nav-pill">Overview</Link>
          <Link to="/admin/assessments" className="admin-nav-pill">Assessments</Link>
          <Link to="/admin/careers" className="admin-nav-pill">Careers</Link>
          <span className="admin-nav-pill admin-nav-pill-active">Student Results</span>
          <Link to="/admin/scores" className="admin-nav-pill">View Scores</Link>
          <Link to="/admin/users" className="admin-nav-pill">Make Admin</Link>
        </nav>

        <section className="admin-section-head">
          <h2 className="admin-section-title">Student Results & Analytics</h2>
          <p className="admin-section-subtitle">Overview of all student assessment results</p>
        </section>

        {loading ? <p className="admin-analytics-note">Loading analytics...</p> : null}
        {error ? <p className="admin-analytics-error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="admin-analytics-kpi-grid">
              <article className="admin-analytics-kpi-card">
                <p className="admin-analytics-kpi-label">Total Attempts</p>
                <h3 className="admin-analytics-kpi-value">{data?.totalAttempts ?? 0}</h3>
                <p className="admin-analytics-kpi-note">Completed assessments</p>
              </article>
              <article className="admin-analytics-kpi-card">
                <p className="admin-analytics-kpi-label">Average Score</p>
                <h3 className="admin-analytics-kpi-value">{Number(data?.averageScore || 0).toFixed(2)}</h3>
                <p className="admin-analytics-kpi-note">Across all submissions</p>
              </article>
            </div>

            <div className="admin-analytics-grid">
              <section className="admin-analytics-card">
                <h3 className="admin-analytics-title">Assessment Completions</h3>
                <p className="admin-analytics-subtitle">Number of students who completed each assessment</p>
                {categoryAttempts.length === 0 ? <p className="admin-analytics-note">No data</p> : null}
                {categoryAttempts.map(([category, count]) => (
                  <div key={category} className="admin-analytics-row-item">
                    <div className="admin-analytics-row-left">
                      <span>{category}</span>
                      <div className="admin-analytics-bar-track">
                        <div
                          className="admin-analytics-bar-fill"
                          style={{ width: `${Math.max(10, (Number(count) / maxAttempts) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </section>

              <section className="admin-analytics-card">
                <h3 className="admin-analytics-title">Score Distribution</h3>
                <p className="admin-analytics-subtitle">Distribution of student scores across all assessments</p>
                {categoryAverages.length === 0 ? <p className="admin-analytics-note">No data</p> : null}
                {categoryAverages.map(([category, avg]) => (
                  <div key={category} className="admin-analytics-row-item">
                    <div className="admin-analytics-row-left">
                      <span>{category}</span>
                      <div className="admin-analytics-bar-track">
                        <div
                          className="admin-analytics-bar-fill-alt"
                          style={{ width: `${Math.max(10, (Number(avg) / maxAverage) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <strong>{Number(avg).toFixed(2)}</strong>
                  </div>
                ))}
              </section>

              <section className="admin-analytics-card admin-analytics-card-wide">
                <h3 className="admin-analytics-title">Recent Assessment Results</h3>
                <p className="admin-analytics-subtitle">Latest student submissions</p>
                {topUsers.length === 0 ? <p className="admin-analytics-note">No assessment results yet</p> : null}
                {topUsers.map(([email, count]) => (
                  <div key={email} className="admin-analytics-row-item">
                    <span className="admin-analytics-email">{email}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </section>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
