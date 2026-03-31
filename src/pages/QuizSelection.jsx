import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getQuizList, logout } from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";
import { buildQuizQuery } from "../services/safeExamBrowser";
import ThemeToggle from "../components/ThemeToggle";

const normalizeQuizItem = (item, index) => {
  if (typeof item === "string") {
    const title = item.trim();
    return {
      id: `${title || "quiz"}-${index}`,
      title: title || `Quiz ${index + 1}`,
      duration: 15,
      questionCount: 8,
      difficulty: "Medium",
      description: ""
    };
  }

  const title = String(item?.title || item?.name || item?.quizTitle || "").trim();
  return {
    id: String(item?.id || `${title || "quiz"}-${index}`),
    title: title || `Quiz ${index + 1}`,
    duration: Number(item?.duration) || 15,
    questionCount: Number(item?.questionCount ?? item?.questions ?? item?.totalQuestions) || 8,
    difficulty: String(item?.difficulty || "Medium"),
    description: String(item?.description || "")
  };
};

export default function QuizSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCategory = location.state?.selectedCategory || "";
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");

  useEffect(() => {
    if (!selectedCategory) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const loadQuizzes = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getQuizList(selectedCategory);
        const normalizedQuizzes = (Array.isArray(data) ? data : [])
          .map((item, index) => normalizeQuizItem(item, index))
          .filter((quiz) => quiz.title);

        setQuizzes(normalizedQuizzes);

        if (normalizedQuizzes.length === 0) {
          setError(`No quizzes found for ${selectedCategory}. Try a different category.`);
        }
      } catch (loadError) {
        setError(loadError.message || "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [selectedCategory, navigate]);

  const onStartQuiz = (quizTitle) => {
    if (!quizTitle) {
      setError("Please select a quiz to start.");
      return;
    }

    const quizQuery = buildQuizQuery(selectedCategory, quizTitle, "assessment");
    navigate(`/quiz${quizQuery}`, {
      state: {
        category: selectedCategory,
        quizTitle: quizTitle,
        launchMode: "assessment"
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
    <div className="quiz-selection-shell">
      <div className="quiz-selection-header">
        <div className="header-content">
          <div className="header-left">
            <button
              type="button"
              className="back-button"
              onClick={() => navigate("/dashboard")}
              aria-label="Go back to dashboard"
            >
              ← Back
            </button>
            <div>
              <h1 className="page-title">Available Quizzes</h1>
              <p className="page-subtitle">Category: <strong>{selectedCategory}</strong></p>
            </div>
          </div>

          <div className="header-actions">
            <ThemeToggle />
            <button type="button" onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="quiz-selection-main">
        {loading ? (
          <div className="loading-state">
            <p className="loading-text">Loading quizzes...</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Back to Categories
            </button>
          </div>
        ) : null}

        {!loading && !error && quizzes.length > 0 ? (
          <section className="quizzes-section" aria-label={`Available quizzes for ${selectedCategory}`}>
            <div className="quizzes-grid">
              {quizzes.map((quiz, index) => (
                <article
                  key={quiz.id || `${quiz.title}-${index}`}
                  className={`quiz-card ${selectedQuizId === quiz.id ? "quiz-card-selected" : ""}`}
                  onClick={() => setSelectedQuizId(quiz.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedQuizId(quiz.id);
                    }
                  }}
                >
                  <div className="quiz-card-header">
                    <div className="quiz-icon">📝</div>
                    <div className="quiz-info">
                      <h3 className="quiz-title">{quiz.title || quiz.name || `Quiz ${index + 1}`}</h3>
                      <p className="quiz-category">{selectedCategory}</p>
                    </div>
                  </div>

                  <div className="quiz-card-meta">
                    <span className="meta-badge">
                      <span className="meta-icon">⏱️</span>
                      <span className="meta-text">{quiz.duration || "15"} min</span>
                    </span>
                    <span className="meta-badge">
                      <span className="meta-icon">❓</span>
                      <span className="meta-text">{quiz.questions || quiz.questionCount || "8"} questions</span>
                    </span>
                    <span className="meta-badge">
                      <span className="meta-icon">📊</span>
                      <span className="meta-text">{quiz.difficulty || "Medium"}</span>
                    </span>
                  </div>

                  {quiz.description ? (
                    <p className="quiz-description">{quiz.description}</p>
                  ) : null}

                  <button
                    type="button"
                    className="quiz-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQuizId(quiz.id);
                      onStartQuiz(quiz.title);
                    }}
                  >
                    Start Quiz →
                  </button>

                  {selectedQuizId === quiz.id ? (
                    <div className="quiz-selection-indicator">
                      <span className="checkmark">✓</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && !error && quizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-text">No quizzes available</p>
            <p className="empty-subtext">Please try a different category or check back later.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Back to Categories
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
