import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, getQuizList, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [quizTitles, setQuizTitles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getCategories();
        setCategories(Array.isArray(data) ? data : []);

        if (!Array.isArray(data) || data.length === 0) {
          setError("No categories found. Login again if your session expired.");
        }
      } catch (loadError) {
        setError(loadError.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const onCategoryChange = async (event) => {
    const category = event.target.value;
    setSelectedCategory(category);
    setSelectedQuiz("");
    setQuizTitles([]);
    setError("");

    if (!category) {
      return;
    }

    try {
      const quizzes = await getQuizList(category);
      setQuizTitles(Array.isArray(quizzes) ? quizzes : []);
    } catch (quizError) {
      setError(quizError.message || "Failed to load quizzes");
    }
  };

  const onStartQuiz = () => {
    if (!selectedCategory || !selectedQuiz) {
      setError("Please choose both category and quiz title.");
      return;
    }

    navigate("/quiz", {
      state: {
        category: selectedCategory,
        quizTitle: selectedQuiz
      }
    });
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
    <div className="dashboard-shell">
      <div className="dashboard-card">
        <div className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">Available Assessments</h1>
            <p className="dashboard-subtitle">
              Complete these assessments to discover your strengths and ideal career paths
            </p>
          </div>

          <div className="dashboard-header-actions">
            <Link to="/user" className="dashboard-back-link">Back to Portal</Link>
            <ThemeToggle />
            <button onClick={onLogout} className="dashboard-logout-btn">Logout</button>
          </div>
        </div>

        {loading ? <p className="dashboard-loading">Loading categories...</p> : null}

        {!loading ? (
          <section className="dashboard-assessment-grid" aria-label="Assessment categories">
            {categories.slice(0, 6).map((item, index) => (
              <article key={item.id} className="dashboard-assessment-card">
                <h2 className="dashboard-assessment-title">{item.name} Assessment</h2>
                <p className="dashboard-assessment-copy">
                  Build confidence in {item.name.toLowerCase()} skills with focused question sets.
                </p>

                <div className="dashboard-assessment-meta">
                  <p>{15 + (index % 3) * 3} minutes</p>
                  <p>8 questions</p>
                </div>

                <button
                  className="dashboard-start-card-btn"
                  onClick={() => onCategoryChange({ target: { value: item.name } })}
                >
                  Select Assessment
                </button>
              </article>
            ))}
          </section>
        ) : null}

        <section className="dashboard-quick-start" aria-label="Quick quiz selection">
          <h2 className="dashboard-quick-start-title">Quick Start</h2>
          <p className="dashboard-quick-start-copy">Choose a category and quiz title to begin immediately.</p>

          <div className="dashboard-form-grid">
            <div>
              <label className="dashboard-label" htmlFor="dashboard-category">Category</label>
              <select
                id="dashboard-category"
                value={selectedCategory}
                onChange={onCategoryChange}
                className="dashboard-select"
              >
                <option value="">Select category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="dashboard-label" htmlFor="dashboard-quiz">Quiz</label>
              <select
                id="dashboard-quiz"
                value={selectedQuiz}
                onChange={(event) => setSelectedQuiz(event.target.value)}
                className="dashboard-select"
                disabled={!selectedCategory}
              >
                <option value="">Select quiz</option>
                {quizTitles.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={onStartQuiz} className="dashboard-start-btn">Start Assessment</button>
        </section>

        {error ? <p className="dashboard-error">{error}</p> : null}
      </div>
    </div>
  );
}
