import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PaginationControls from "../components/PaginationControls";
import ThemeToggle from "../components/ThemeToggle";
import { getCareerCatalog, getCareerInsights, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";
import { withResolvedBase } from "../services/basePath";

const CATEGORY_ICON = {
  Technical: "💻",
  Aptitude: "📊",
  Logical: "🧠",
  Personality: "🤝",
  "Career Interest": "🎯"
};

const PAGE_SIZE = 4;

export default function CareerExplorer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [careers, setCareers] = useState([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [careerSearch, setCareerSearch] = useState("");
  const [careerInsight, setCareerInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);

  const matchedCareerTitles = useMemo(() => {
    const items = Array.isArray(location.state?.matchedCareerTitles)
      ? location.state.matchedCareerTitles
      : [];

    return Array.from(
      new Set(items.map((item) => String(item || "").trim()).filter(Boolean))
    );
  }, [location.state]);

  useEffect(() => {
    const loadCareers = async () => {
      setLoading(true);
      setError("");

      try {
        const list = await getCareerCatalog();
        setCareers(Array.isArray(list) ? list : []);
      } catch (loadError) {
        setError(loadError?.message || "Unable to load careers right now.");
        setCareers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCareers();
  }, []);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(careers.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b))
    ];
  }, [careers]);

  useEffect(() => {
    if (!matchedCareerTitles.length) {
      return;
    }

    setShowMatchedOnly(true);

    const matchedCategory = String(location.state?.matchedCategory || "").trim();
    if (matchedCategory) {
      setCategory(matchedCategory);
    }

    const firstMatch = matchedCareerTitles[0];
    setCareerSearch(firstMatch);
    void onSearchCareerInsight(firstMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCareerTitles]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = careers.filter((item) => {
      const categoryMatch = category === "All" || item.category === category;
      const queryMatch = !q || `${item.role} ${item.skills} ${item.path}`.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });

    if (!showMatchedOnly || matchedCareerTitles.length === 0) {
      return base;
    }

    const matchedSet = new Set(matchedCareerTitles.map((item) => item.toLowerCase()));
    const matchedOnly = base.filter((item) => matchedSet.has(String(item.role || "").toLowerCase()));

    return matchedOnly.length > 0 ? matchedOnly : base;
  }, [careers, category, query, showMatchedOnly, matchedCareerTitles]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedCareers = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const onCategoryChange = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const onQueryChange = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const onSearchCareerInsight = async (value) => {
    const searchValue = String(value ?? careerSearch).trim();
    if (!searchValue) {
      setInsightError("Please type a career name to get AI insights.");
      return;
    }

    setInsightLoading(true);
    setInsightError("");

    try {
      const insight = await getCareerInsights(searchValue);
      setCareerInsight(insight);
      setCareerSearch(searchValue);
    } catch (insightLoadError) {
      setInsightError(insightLoadError?.message || "Unable to fetch career insights right now.");
      setCareerInsight(null);
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="student-page-shell">
      <header className="student-page-topbar">
        <div>
          <h1 className="student-page-title">Career Explorer</h1>
          <p className="student-page-subtitle">Explore role pathways aligned to your assessment outcomes and interests</p>
        </div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button type="button" onClick={onLogout} className="student-page-logout-btn">Logout</button>
        </div>
      </header>

      <main className="student-page-content">
        <nav className="student-page-nav-pills" aria-label="Student navigation">
          <Link to="/user" className="student-page-nav-pill">Dashboard</Link>
          <Link to="/dashboard" className="student-page-nav-pill">Assessments</Link>
          <Link to="/results" className="student-page-nav-pill">Results</Link>
          <span className="student-page-nav-pill student-page-nav-pill-active">Explore Careers</span>
        </nav>

        <div className="career-card">
        <div className="career-header-row">
          <h1 className="career-title">Career Explorer</h1>
          <Link to="/user" className="career-back-link">Back to Portal</Link>
        </div>

        <p className="career-subtitle">Explore clear career pathways based on interests, skills, and aptitude fit.</p>

        <div className="career-hero" role="img" aria-label="Career growth illustration banner">
          <img src={withResolvedBase("career-banner.svg")} alt="Career growth banner" className="career-hero-image" />
          <img src={withResolvedBase("career-icons.svg")} alt="Career icon set" className="career-hero-icons" />
          <div className="career-hero-copy">
            <p>Curated paths for learners and job-ready candidates</p>
            <small>Use filters, matched views, and pagination to navigate roles faster.</small>
          </div>
        </div>

        <div className="career-filter-row">
          <select value={category} onChange={onCategoryChange} className="career-select">
            {categories.map((item) => (
              <option key={item} value={item}>{item === "All" ? "All Categories" : item}</option>
            ))}
          </select>

          <input
            value={query}
            onChange={onQueryChange}
            placeholder="Search by role or skill"
            className="career-input"
          />
        </div>

        {matchedCareerTitles.length > 0 ? (
          <div className="career-match-strip">
            <p className="career-match-label">Your matched career options:</p>
            <div className="career-match-actions">
              {matchedCareerTitles.map((title) => (
                <button
                  key={title}
                  type="button"
                  className="career-match-pill"
                  onClick={() => {
                    setShowMatchedOnly(true);
                    setCareerSearch(title);
                    void onSearchCareerInsight(title);
                  }}
                >
                  {title}
                </button>
              ))}
              <button
                type="button"
                className="career-match-toggle"
                onClick={() => setShowMatchedOnly((value) => !value)}
              >
                {showMatchedOnly ? "Show All Careers" : "Show Matched Only"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="career-ai-search-row">
          <input
            value={careerSearch}
            onChange={(event) => setCareerSearch(event.target.value)}
            placeholder="Search any career for AI guidance (e.g. Data Scientist, Product Manager)"
            className="career-input career-ai-input"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearchCareerInsight(careerSearch);
              }
            }}
          />
          <button
            type="button"
            className="career-ai-btn"
            onClick={() => onSearchCareerInsight(careerSearch)}
            disabled={insightLoading}
          >
            {insightLoading ? "Finding Career Details..." : "AI Career Search"}
          </button>
        </div>

        {insightError ? <p className="career-empty">{insightError}</p> : null}

        {careerInsight ? (
          <section className="career-insight-card" aria-label="AI career details">
            <div className="career-insight-head">
              <h2 className="career-insight-title">{careerInsight.role}</h2>
              <p className="career-tag">
                <span aria-hidden="true">{CATEGORY_ICON[careerInsight.category] || "⭐"}</span> {careerInsight.category}
              </p>
            </div>

            <p className="career-insight-overview">{careerInsight.overview}</p>

            <div className="career-insight-grid">
              <article className="career-insight-section">
                <h3>Required Skills</h3>
                <ul>
                  {(careerInsight.skills || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="career-insight-section">
                <h3>Learning Roadmap</h3>
                <ul>
                  {(careerInsight.roadmap || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="career-insight-section">
                <h3>Day-to-Day Responsibilities</h3>
                <ul>
                  {(careerInsight.responsibilities || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="career-insight-section">
                <h3>Tools & Tech</h3>
                <ul>
                  {(careerInsight.tools || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="career-insight-meta">
              <p><strong>Salary Range:</strong> {careerInsight.salaryRange}</p>
              <p><strong>Future Scope:</strong> {careerInsight.futureScope}</p>
            </div>

            <div className="career-suggestions">
              <h3>Suggested Careers</h3>
              <div className="career-suggestion-list">
                {(careerInsight.suggestions || []).length ? (
                  careerInsight.suggestions.map((item) => (
                    <button
                      type="button"
                      key={`${item.title}-${item.reason}`}
                      className="career-suggestion-item"
                      onClick={() => onSearchCareerInsight(item.title)}
                    >
                      <span className="career-suggestion-title">{item.title}</span>
                      <span className="career-suggestion-reason">{item.reason}</span>
                    </button>
                  ))
                ) : (
                  <p className="career-meta">No related suggestions are available for this search yet.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <p className="career-meta">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} careers
        </p>

        {loading ? <p className="career-meta">Loading careers...</p> : null}
        {error ? <p className="career-empty">{error}</p> : null}

        <div className="career-grid">
          {pagedCareers.map((item) => (
            <article key={item.id || `${item.role}-${item.category}`} className="career-item-card">
              <p className="career-tag">
                <span aria-hidden="true">{CATEGORY_ICON[item.category] || "⭐"}</span> {item.category}
              </p>
              <h3 className="career-item-title">{item.role}</h3>
              <p className="career-text"><strong>Skills:</strong> {item.skills}</p>
              <p className="career-text"><strong>Path:</strong> {item.path}</p>
              <button
                type="button"
                className="career-details-btn"
                onClick={() => onSearchCareerInsight(item.role)}
              >
                View Full Career Details
              </button>
            </article>
          ))}
        </div>

        {!pagedCareers.length ? <p className="career-empty">No careers matched your filters. Try a broader keyword or category.</p> : null}

        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          ariaLabel="Career pages"
          classPrefix="career"
        />
      </div>
      </main>
    </div>
  );
}
