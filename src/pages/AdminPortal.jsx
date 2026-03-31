import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { getAiGenerationStatus, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

export default function AdminPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showServiceAlert, setShowServiceAlert] = useState(true);
  const [aiStatus, setAiStatus] = useState({ available: false, message: "Checking AI service..." });

  const selectedAssessment = location.state?.selectedAssessment || "";
  const selectedQuiz = location.state?.selectedQuiz || "";

  useEffect(() => {
    const loadAiStatus = async () => {
      const status = await getAiGenerationStatus();
      setAiStatus(status);
    };

    loadAiStatus();
  }, []);

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
          <button type="button" onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <nav className="admin-nav-pills" aria-label="Admin navigation">
          <span className="admin-nav-pill admin-nav-pill-active">Overview</span>
          <Link to="/admin/assessments" className="admin-nav-pill">Assessments</Link>
          <Link to="/admin/careers" className="admin-nav-pill">Careers</Link>
          <Link to="/admin/analytics" className="admin-nav-pill">Student Results</Link>
          <Link to="/admin/scores" className="admin-nav-pill">View Scores</Link>
          <Link to="/admin/users" className="admin-nav-pill">Make Admin</Link>
        </nav>

        {showServiceAlert && (
          <div className="admin-alert-banner">
            <div className="admin-alert-content">
              <h3 className="admin-alert-title">AI Service Status</h3>
              {aiStatus.available ? (
                <>
                  <p className="admin-alert-text">{aiStatus.message}</p>
                  <p className="admin-alert-text">You can now:</p>
                  <ul className="admin-alert-list">
                    <li>Generate AI assessments for students from the Assessments page</li>
                    <li>Publish those quizzes directly into the user assessment flow</li>
                    <li>Let users generate their own AI practice quizzes</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="admin-alert-text">{aiStatus.message}</p>
                  <p className="admin-alert-text">You can still:</p>
                  <ul className="admin-alert-list">
                    <li>Manually create quizzes using the Assessments page</li>
                    <li>Review existing assessments and results</li>
                    <li>Try again after backend service restarts</li>
                  </ul>
                </>
              )}
            </div>
            <button type="button" onClick={() => setShowServiceAlert(false)} className="admin-alert-close">×</button>
          </div>
        )}

        <section className="admin-section-head">
          <h2 className="admin-section-title">Platform Overview</h2>
          <p className="admin-section-subtitle">Quick access to assessments, careers, and student analytics</p>
        </section>

        {selectedAssessment ? (
          <section className="admin-selection-banner" aria-label="Selected assessment">
            <p>
              <strong>Selected Assessment:</strong> {selectedAssessment}
              {selectedQuiz ? ` • ${selectedQuiz}` : ""}
            </p>
          </section>
        ) : null}

        <section className="admin-kpi-grid" aria-label="Admin overview metrics">
          <article className="admin-kpi-card">
            <p className="admin-kpi-label">Assessments</p>
            <h3 className="admin-kpi-value">3</h3>
            <p className="admin-kpi-note">core assessment tracks</p>
          </article>
          <article className="admin-kpi-card">
            <p className="admin-kpi-label">Career Profiles</p>
            <h3 className="admin-kpi-value">8</h3>
            <p className="admin-kpi-note">available in catalog</p>
          </article>
          <article className="admin-kpi-card">
            <p className="admin-kpi-label">Result Insights</p>
            <h3 className="admin-kpi-value">Live</h3>
            <p className="admin-kpi-note">performance analytics dashboard</p>
          </article>
        </section>

        <section className="admin-card-grid">
          <article className="admin-action-card">
            <h3 className="admin-action-title">Manage Assessments</h3>
            <p className="admin-action-copy">Create and edit quiz questions, categories, and assessment flow.</p>
            <Link to="/admin/assessments" className="admin-action-link">Open Assessments</Link>
          </article>

          <article className="admin-action-card">
            <h3 className="admin-action-title">Manage Careers</h3>
            <p className="admin-action-copy">Update career descriptions, salary ranges, and skill recommendations.</p>
            <Link to="/admin/careers" className="admin-action-link">Open Careers</Link>
          </article>

          <article className="admin-action-card">
            <h3 className="admin-action-title">Student Results</h3>
            <p className="admin-action-copy">Monitor total attempts, average scores, and category distribution.</p>
            <Link to="/admin/analytics" className="admin-action-link">View Analytics</Link>
          </article>

          <article className="admin-action-card">
            <h3 className="admin-action-title">User Management</h3>
            <p className="admin-action-copy">Review scores and update admin privileges for platform users.</p>
            <div className="admin-action-row">
              <Link to="/admin/scores" className="admin-action-link admin-action-link-muted">View Scores</Link>
              <Link to="/admin/users" className="admin-action-link admin-action-link-muted">Make Admin</Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}