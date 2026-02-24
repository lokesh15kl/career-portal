import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";
import { getAttempts } from "../services/userProgress";
import ThemeToggle from "../components/ThemeToggle";

export default function UserPortal() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Student");
  const [attempts] = useState(() => {
    const storedAttempts = getAttempts();
    return Array.isArray(storedAttempts) ? storedAttempts : [];
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        const resolvedName = user?.name || user?.fullName || user?.email?.split("@")[0] || "Student";
        setDisplayName(resolvedName);
      } catch {
        setDisplayName("Student");
      }
    };

    loadUser();
  }, []);

  const metrics = useMemo(() => {
    const totalAttempts = attempts.length;

    const averageScore = totalAttempts
      ? Math.round(
        attempts.reduce((sum, item) => {
          const total = Number(item.totalQuestions) || 0;
          const score = Number(item.score) || 0;
          const normalized = total > 0 ? (score / total) * 100 : 0;
          return sum + normalized;
        }, 0) / totalAttempts
      )
      : 0;

    const careerMatches = new Set(
      attempts.flatMap((item) => (Array.isArray(item.recommendations) ? item.recommendations.map((rec) => rec.title) : []))
    ).size;

    const savedCareersRaw = localStorage.getItem("saved_careers");
    const savedCareers = (() => {
      if (!savedCareersRaw) return 0;
      try {
        const parsed = JSON.parse(savedCareersRaw);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    })();

    return {
      totalAttempts,
      averageScore,
      careerMatches,
      savedCareers
    };
  }, [attempts]);

  const latestAttempt = attempts[0] || null;

  const initials = displayName.trim().charAt(0).toUpperCase() || "S";

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
    <div className="user-portal-shell">
      <header className="user-portal-topbar">
        <div className="user-portal-identity">
          <div className="user-avatar" aria-hidden="true">{initials}</div>
          <div>
            <h1 className="user-title">Welcome, {displayName}</h1>
            <p className="user-subtitle">Student Dashboard</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle />
          <button onClick={onLogout} className="user-logout-btn">Logout</button>
        </div>
      </header>

      <main className="user-portal-content">
        <nav className="user-nav-pills" aria-label="User portal navigation">
          <span className="user-nav-pill user-nav-pill-active">Dashboard</span>
          <Link to="/dashboard" className="user-nav-pill">Assessments</Link>
          <Link to="/results" className="user-nav-pill">Results</Link>
          <Link to="/careers" className="user-nav-pill">Explore Careers</Link>
        </nav>

        <section className="user-metrics-grid" aria-label="Performance overview">
          <article className="user-metric-card">
            <p className="user-metric-label">Assessments Completed</p>
            <h2 className="user-metric-value">{metrics.totalAttempts}</h2>
            <p className="user-metric-note">track your overall progress</p>
          </article>

          <article className="user-metric-card">
            <p className="user-metric-label">Average Score</p>
            <h2 className="user-metric-value">{metrics.averageScore}%</h2>
            <p className="user-metric-note">across completed attempts</p>
          </article>

          <article className="user-metric-card">
            <p className="user-metric-label">Career Matches</p>
            <h2 className="user-metric-value">{metrics.careerMatches}</h2>
            <p className="user-metric-note">identified for your profile</p>
          </article>

          <article className="user-metric-card">
            <p className="user-metric-label">Saved Careers</p>
            <h2 className="user-metric-value">{metrics.savedCareers}</h2>
            <p className="user-metric-note">ready for later review</p>
          </article>
        </section>

        <section className="user-recent-panel" aria-label="Recent activity">
          <h2 className="user-recent-title">Recent Activity</h2>
          <p className="user-recent-subtitle">Your latest assessment results</p>

          {latestAttempt ? (
            <div className="user-recent-card">
              <p className="user-recent-meta">{new Date(latestAttempt.timestamp).toLocaleString()}</p>
              <h3 className="user-recent-heading">{latestAttempt.category} • {latestAttempt.quizTitle}</h3>
              <p className="user-recent-score">
                Score: {latestAttempt.score} / {latestAttempt.totalQuestions}
              </p>
              <Link to="/results" className="user-primary-action">View Full Results</Link>
            </div>
          ) : (
            <div className="user-empty-state">
              <p className="user-empty-text">No assessments completed yet</p>
              <Link to="/dashboard" className="user-primary-action">Take Your First Assessment</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}