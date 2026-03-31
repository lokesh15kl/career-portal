import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  logout
} from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";
import { getAttempts } from "../services/userProgress";
import ThemeToggle from "../components/ThemeToggle";

export default function UserPortal() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Student");
  const [profileImageUrl, setProfileImageUrl] = useState("");
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
        setProfileImageUrl(String(user?.profileImageUrl || ""));
      } catch {
        setDisplayName("Student");
        setProfileImageUrl("");
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

  const matchedCareerTitles = useMemo(() => {
    return Array.from(
      new Set(
        attempts.flatMap((item) =>
          Array.isArray(item.recommendations)
            ? item.recommendations.map((rec) => String(rec?.title || "").trim()).filter(Boolean)
            : []
        )
      )
    );
  }, [attempts]);

  const latestAttempt = attempts[0] || null;

  const initials = displayName.trim().charAt(0).toUpperCase() || "S";

  const onScrollToProfile = () => {
    navigate("/profile");
  };

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

  const onOpenCareerMatches = () => {
    const latestCategory = String(latestAttempt?.category || "").trim();

    navigate("/careers", {
      state: {
        matchedCareerTitles,
        matchedCategory: latestCategory
      }
    });
  };

  return (
    <div className="dashboard-container">
      {/* Modern Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="user-avatar-large">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" />
              ) : (
                initials
              )}
            </div>
            <div className="header-info">
              <h1 className="dashboard-title">Welcome back, {displayName}</h1>
              <p className="dashboard-subtitle">Track your progress and explore opportunities</p>
            </div>
          </div>

          <div className="header-actions">
            <ThemeToggle />
            <button 
              onClick={onScrollToProfile} 
              className="btn-icon-primary" 
              title="View Profile"
              type="button"
            >
              ⚙️
            </button>
            <button type="button" onClick={onLogout} className="btn-logout" title="Logout">
              🚪
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Quick Navigation */}
        <nav className="quick-nav">
          <Link to="/dashboard" className="nav-item active">
            <span className="nav-icon">📝</span>
            <span className="nav-label">Take Assessment</span>
          </Link>
          <Link to="/results" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">View Results</span>
          </Link>
          <Link to="/careers" className="nav-item">
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Career Paths</span>
          </Link>
        </nav>

        {/* Stats Grid */}
        <section className="stats-section">
          <h2 className="section-title">Your Progress</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <p className="stat-label">Assessments</p>
                <h3 className="stat-value">{metrics.totalAttempts}</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">Avg Score</p>
                <h3 className="stat-value">{metrics.averageScore}%</h3>
              </div>
            </div>

            <button
              type="button"
              className="stat-card stat-card-action"
              onClick={onOpenCareerMatches}
              title="Open your matched career options"
            >
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <p className="stat-label">Career Matches</p>
                <h3 className="stat-value">{metrics.careerMatches}</h3>
              </div>
            </button>

            <div className="stat-card">
              <div className="stat-icon">💾</div>
              <div className="stat-content">
                <p className="stat-label">Saved Careers</p>
                <h3 className="stat-value">{metrics.savedCareers}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>
          {latestAttempt ? (
            <div className="activity-card">
              <div className="activity-header">
                <h3 className="activity-title">{latestAttempt.quizTitle}</h3>
                <span className="activity-badge">{latestAttempt.category}</span>
              </div>
              <div className="activity-meta">
                <span className="meta-item">📅 {new Date(latestAttempt.timestamp).toLocaleDateString()}</span>
                <span className="meta-item">⏱️ {new Date(latestAttempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="activity-score">
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{width: `${(latestAttempt.score / latestAttempt.totalQuestions) * 100}%`}}
                  ></div>
                </div>
                <p className="score-text">Score: {latestAttempt.score}/{latestAttempt.totalQuestions}</p>
              </div>
              <Link to="/results" className="btn-primary">
                View Detailed Results →
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No assessments yet</h3>
              <p>Start taking assessments to track your progress</p>
              <Link to="/dashboard" className="btn-primary">
                Take First Assessment
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}