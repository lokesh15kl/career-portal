import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { getAdminScores, logout, promoteUserToAdmin } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [candidates, setCandidates] = useState([]);

  const uniqueCandidates = useMemo(() => {
    const seen = new Set();
    return candidates.filter((item) => {
      const email = String(item || "").trim().toLowerCase();
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
  }, [candidates]);

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

  const onLoadCandidates = async () => {
    setLoadingCandidates(true);
    setFeedback({ type: "", text: "" });

    try {
      const rows = await getAdminScores();
      const emails = Array.isArray(rows)
        ? rows.map((item) => String(item?.email || "").trim()).filter(Boolean)
        : [];
      setCandidates(emails);
    } catch (error) {
      setFeedback({ type: "error", text: error?.message || "Unable to load users from score records." });
    } finally {
      setLoadingCandidates(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const value = identifier.trim();
    if (!value) {
      setFeedback({ type: "error", text: "Please enter email or username." });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: "", text: "" });

    try {
      const result = await promoteUserToAdmin(value);
      setFeedback({
        type: "success",
        text: result?.message || `${value} promoted to admin.`
      });
      setIdentifier("");
    } catch (error) {
      setFeedback({ type: "error", text: error?.message || "Unable to promote user." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-identity">
          <div className="admin-avatar" aria-hidden="true">A</div>
          <div>
            <h1 className="admin-title">User Management</h1>
            <p className="admin-subtitle">Grant admin access to existing users</p>
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
          <Link to="/admin/analytics" className="admin-nav-pill">Student Results</Link>
          <Link to="/admin/scores" className="admin-nav-pill">View Scores</Link>
          <span className="admin-nav-pill admin-nav-pill-active">Make Admin</span>
        </nav>

        <section className="admin-section-head">
          <h2 className="admin-section-title">Promote User</h2>
          <p className="admin-section-subtitle">Enter an email or username and grant admin role.</p>
        </section>

        <section className="admin-careers-card">
          <form onSubmit={onSubmit} className="admin-careers-form">
            <label htmlFor="admin-identifier" className="admin-careers-label">Email / Username</label>
            <div className="admin-careers-input-row">
              <input
                id="admin-identifier"
                className="admin-careers-input"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="user@example.com"
              />
              <button type="submit" className="admin-careers-add-btn" disabled={submitting}>
                {submitting ? "Updating..." : "Make Admin"}
              </button>
            </div>
          </form>

          {feedback.text ? (
            <p className={`admin-careers-feedback ${feedback.type === "success" ? "admin-careers-feedback-success" : "admin-careers-feedback-error"}`}>
              {feedback.text}
            </p>
          ) : null}

          <div className="admin-careers-list-wrap">
            <div className="admin-careers-form-actions">
              <h3 className="admin-careers-list-title">Candidate Emails</h3>
              <button type="button" className="admin-careers-secondary-btn" onClick={onLoadCandidates} disabled={loadingCandidates}>
                {loadingCandidates ? "Loading..." : "Load from Scores"}
              </button>
            </div>

            {uniqueCandidates.length === 0 ? (
              <p className="admin-careers-meta">No candidate list loaded yet.</p>
            ) : (
              <div className="admin-careers-sections-grid">
                {uniqueCandidates.map((email) => (
                  <div key={email} className="admin-careers-section-row">
                    <span className="admin-careers-chip">{email}</span>
                    <div className="admin-careers-profile-actions">
                      <button
                        type="button"
                        className="admin-careers-secondary-btn"
                        onClick={() => setIdentifier(email)}
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
