import { Link, useNavigate } from "react-router-dom";
import { clearAttempts, getAttempts } from "../services/userProgress";
import { useState } from "react";
import PaginationControls from "../components/PaginationControls";
import ThemeToggle from "../components/ThemeToggle";
import { logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

const CATEGORY_ICON = {
  Technical: "💻",
  Aptitude: "📊",
  Logical: "🧠",
  Personality: "🤝",
  "Career Interest": "🎯"
};

const PAGE_SIZE = 4;

function withBase(path) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${String(path).replace(/^\/+/, "")}`;
}

export default function MyResults() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(() => {
    const items = getAttempts();
    return [...items].sort((first, second) => new Date(second.timestamp) - new Date(first.timestamp));
  });
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedAttempts = attempts.slice(pageStart, pageStart + PAGE_SIZE);

  const onClear = () => {
    clearAttempts();
    setAttempts([]);
    setPage(1);
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

  return (
    <div className="student-page-shell">
      <header className="student-page-topbar">
        <div>
          <h1 className="student-page-title">My Results</h1>
          <p className="student-page-subtitle">Track your assessment performance and recommendations</p>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button onClick={onLogout} className="student-page-logout-btn">Logout</button>
        </div>
      </header>

      <main className="student-page-content">
        <nav className="student-page-nav-pills" aria-label="Student navigation">
          <Link to="/user" className="student-page-nav-pill">Dashboard</Link>
          <Link to="/dashboard" className="student-page-nav-pill">Assessments</Link>
          <span className="student-page-nav-pill student-page-nav-pill-active">Results</span>
          <Link to="/careers" className="student-page-nav-pill">Explore Careers</Link>
        </nav>

        <div className="results-card">
        <div className="results-header-row">
          <h1 className="results-title">My Results</h1>
          <div className="results-actions-row">
            <button onClick={onClear} className="results-clear-btn">Clear</button>
            <Link to="/user" className="results-back-link">Back to Portal</Link>
          </div>
        </div>

        <div className="results-hero" role="img" aria-label="Results dashboard visuals">
          <img src={withBase("career-banner.svg")} alt="Progress chart banner" className="results-hero-image" />
          <img src={withBase("career-icons.svg")} alt="Career indicator icons" className="results-hero-icons" />
          <div className="results-hero-copy">
            <p>Track performance history and recommendations over time</p>
            <small>Use page controls to browse your full assessment timeline.</small>
          </div>
        </div>

        {attempts.length === 0 ? (
          <p className="results-empty">No results yet. Complete an assessment to see your progress.</p>
        ) : (
          <>
            <p className="results-meta-line">
              Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, attempts.length)} of {attempts.length} results
            </p>

            <div className="results-grid">
              {pagedAttempts.map((item) => (
                <article key={item.id} className="results-item-card">
                  <p className="results-meta">{new Date(item.timestamp).toLocaleString()}</p>
                  <h3 className="results-item-title">
                    <span aria-hidden="true">{CATEGORY_ICON[item.category] || "⭐"}</span> {item.category} • {item.quizTitle}
                  </h3>
                  <p className="results-score">Score: {item.score} / {item.totalQuestions}</p>

                  {Array.isArray(item.recommendations) && item.recommendations.length > 0 ? (
                    <div>
                      <p className="results-rec-heading">Top Recommendations</p>
                      {item.recommendations.slice(0, 2).map((rec) => (
                        <p key={rec.title} className="results-rec-item">• {rec.title}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <PaginationControls
              page={safePage}
              totalPages={totalPages}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              ariaLabel="Results pages"
              classPrefix="results"
            />
          </>
        )}
      </div>
      </main>
    </div>
  );
}
