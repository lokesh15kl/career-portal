import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateAiPracticeQuiz, getCategories, getQuizList, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";
import { buildQuizQuery } from "../services/safeExamBrowser";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState(6);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [practiceNotice, setPracticeNotice] = useState("");

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

  const onCategorySelect = (categoryName) => {
    navigate("/quiz-selection", {
      state: { selectedCategory: categoryName }
    });
  };

  const onGenerateAiPractice = async () => {
    const topic = aiTopic.trim();

    if (!topic) {
      setError("Please type a topic before generating AI practice.");
      return;
    }

    setAiGenerating(true);
    setError("");
    setPracticeNotice("");

    try {
      const result = await generateAiPracticeQuiz({
        topic,
        difficulty: aiDifficulty,
        questionCount: aiQuestionCount,
        quizTitle: `${topic} Practice`
      });

      const generatedCategory = String(result?.category || topic).trim() || topic;
      const generatedQuizTitle = String(result?.quizTitle || `${topic} Practice`).trim();

      if (!generatedQuizTitle) {
        throw new Error("AI generation succeeded but quiz title was empty.");
      }

      setPracticeNotice(result?.message || "AI practice quiz generated. Starting now...");

      const quizQuery = buildQuizQuery(generatedCategory, generatedQuizTitle, "practice");
      navigate(`/quiz${quizQuery}`, {
        state: {
          category: generatedCategory,
          quizTitle: generatedQuizTitle,
          launchMode: "practice"
        }
      });
    } catch (generationError) {
      setError(generationError?.message || "Failed to generate AI practice quiz.");
    } finally {
      setAiGenerating(false);
    }
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
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">Available Assessments</h1>
            <p className="dashboard-subtitle">Select an assessment track to discover strengths, gaps, and best-fit career paths</p>
          </div>

          <div className="header-actions">
            <Link to="/user" className="header-link">Back to Portal</Link>
            <ThemeToggle />
            <button type="button" onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {loading ? <p className="dashboard-loading">Loading categories...</p> : null}

        {!loading && categories.length > 0 ? (
          <section className="assessment-categories" aria-label="Assessment categories">
            <h2 className="section-title">Select an Assessment Category</h2>
            <div className="assessment-grid">
              {categories.map((category, index) => (
                <article
                  key={category.id ||category.name}
                  className="assessment-card"
                  onClick={() => onCategorySelect(category.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onCategorySelect(category.name);
                    }
                  }}
                >
                  <div className="assessment-card-icon">📊</div>
                  <h3 className="assessment-card-title">{category.name} Assessment</h3>
                  <p className="assessment-card-description">
                    Build confidence in {category.name.toLowerCase()} skills with focused question sets.
                  </p>

                  <div className="assessment-card-meta">
                    <span className="meta-item">
                      <span className="meta-label">Duration:</span>
                      <span className="meta-value">{15 + (index % 3) * 3} minutes</span>
                    </span>
                    <span className="meta-item">
                      <span className="meta-label">Questions:</span>
                      <span className="meta-value">~8</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="category-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCategorySelect(category.name);
                    }}
                  >
                    Start Assessment →
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="ai-practice-section" aria-label="AI practice generator">
          <h2 className="section-title">AI Practice Generator</h2>
          <p className="section-subtitle">Create a focused practice quiz instantly to improve weak areas.</p>

          <div className="practice-form">
            <div className="form-field">
              <label className="form-label" htmlFor="ai-topic">Topic Focus</label>
              <input
                id="ai-topic"
                className="form-input"
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                placeholder="e.g. Java, SQL, Aptitude"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="ai-difficulty">Difficulty</label>
              <select
                id="ai-difficulty"
                className="form-input"
                value={aiDifficulty}
                onChange={(event) => setAiDifficulty(event.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="ai-count">Number of Questions</label>
              <input
                id="ai-count"
                type="number"
                min={3}
                max={20}
                className="form-input"
                value={aiQuestionCount}
                onChange={(event) => setAiQuestionCount(Number(event.target.value) || 6)}
              />
            </div>
          </div>

          <button type="button" onClick={onGenerateAiPractice} className="btn-primary" disabled={aiGenerating}>
            {aiGenerating ? "Generating AI Practice..." : "Generate AI Practice Quiz"}
          </button>

          {practiceNotice ? <p className="success-message">{practiceNotice}</p> : null}
        </section>

        {error ? <p className="error-message">{error}</p> : null}
      </div>
    </div>
  );
}
