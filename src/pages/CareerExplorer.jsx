import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PaginationControls from "../components/PaginationControls";
import ThemeToggle from "../components/ThemeToggle";
import { getCareerCatalog, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

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
  const [careers, setCareers] = useState([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    return careers.filter((item) => {
      const categoryMatch = category === "All" || item.category === category;
      const queryMatch = !q || `${item.role} ${item.skills} ${item.path}`.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [careers, category, query]);

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

  return (
    <div className="student-page-shell">
      <header className="student-page-topbar">
        <div>
          <h1 className="student-page-title">Career Explorer</h1>
          <p className="student-page-subtitle">Explore roles that align with your strengths and interests</p>
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
          <Link to="/results" className="student-page-nav-pill">Results</Link>
          <span className="student-page-nav-pill student-page-nav-pill-active">Explore Careers</span>
        </nav>

        <div className="career-card">
        <div className="career-header-row">
          <h1 className="career-title">Career Explorer</h1>
          <Link to="/user" className="career-back-link">Back to Portal</Link>
        </div>

        <p className="career-subtitle">Explore clean career pathways based on interest, skill, and aptitude.</p>

        <div className="career-hero" role="img" aria-label="Career growth illustration banner">
          <img src="/career-banner.svg" alt="Career growth banner" className="career-hero-image" />
          <img src="/career-icons.svg" alt="Career icon set" className="career-hero-icons" />
          <div className="career-hero-copy">
            <p>Curated paths for learners and job-ready candidates</p>
            <small>Use filters and pagination to quickly navigate role options.</small>
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
            </article>
          ))}
        </div>

        {!pagedCareers.length ? <p className="career-empty">No careers found. Try a different filter or search keyword.</p> : null}

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
