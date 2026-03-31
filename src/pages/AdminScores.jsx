import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { getAdminScores, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

export default function AdminScores() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const timeA = a?.attemptedAt ? Date.parse(a.attemptedAt) : 0;
      const timeB = b?.attemptedAt ? Date.parse(b.attemptedAt) : 0;
      return Number.isFinite(timeB) ? timeB - (Number.isFinite(timeA) ? timeA : 0) : 0;
    });
  }, [rows]);

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
        const result = await getAdminScores();
        setRows(Array.isArray(result) ? result : []);
      } catch (loadError) {
        setError(loadError?.message || "Unable to load score records.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-identity">
          <div className="admin-avatar" aria-hidden="true">A</div>
          <div>
            <h1 className="admin-title">Scores</h1>
            <p className="admin-subtitle">Review submitted attempts across all assessments</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle />
          <button type="button" onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <nav className="admin-nav-pills" aria-label="Admin navigation">
          <Link to="/admin" className="admin-nav-pill">Overview</Link>
          <Link to="/admin/assessments" className="admin-nav-pill">Assessments</Link>
          <Link to="/admin/careers" className="admin-nav-pill">Careers</Link>
          <Link to="/admin/analytics" className="admin-nav-pill">Student Results</Link>
          <span className="admin-nav-pill admin-nav-pill-active">View Scores</span>
          <Link to="/admin/users" className="admin-nav-pill">Make Admin</Link>
        </nav>

        <section className="admin-section-head">
          <h2 className="admin-section-title">All Score Records</h2>
          <p className="admin-section-subtitle">Most recent assessment outcomes across categories and quizzes.</p>
        </section>

        {loading ? <p className="admin-analytics-note">Loading score records...</p> : null}
        {error ? <p className="admin-analytics-error">{error}</p> : null}

        {!loading && !error ? (
          <section className="admin-careers-list-wrap">
            <h3 className="admin-careers-list-title">Recent Attempts</h3>
            {sortedRows.length === 0 ? (
              <p className="admin-careers-meta">No score records are available yet.</p>
            ) : (
              <div className="admin-careers-profiles-grid">
                {sortedRows.map((item, index) => (
                  <article key={item.id || `${item.email}-${index}`} className="admin-careers-profile-card">
                    <h4 className="admin-careers-profile-title">{item.email}</h4>
                    <p className="admin-careers-chip">{item.category}</p>
                    <p className="admin-careers-meta"><strong>Quiz:</strong> {item.quizTitle || "-"}</p>
                    <p className="admin-careers-meta"><strong>Score:</strong> {item.score} / {item.totalQuestions}</p>
                    <p className="admin-careers-meta"><strong>Submitted:</strong> {item.attemptedAt || "-"}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
