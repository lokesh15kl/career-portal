import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import {
  addAdminAssessmentCategory,
  createAdminQuiz,
  deleteAdminAssessmentCategory,
  generateAiAssessmentForAdmin,
  getAdminAssessmentCategories,
  getManualQuestions,
  logout,
  saveManualQuestion
} from "../services/api";
import { setLoggedIn, setRole } from "../services/auth";

const DEFAULT_ASSESSMENTS = [
  { id: "personality", title: "Personality Assessment", note: "Behavioral fit and work-style insights" },
  { id: "aptitude", title: "Aptitude Assessment", note: "Numerical and analytical capability" },
  { id: "technical", title: "Technical Assessment", note: "Programming and domain readiness" },
  { id: "logical", title: "Logical Assessment", note: "Reasoning and problem-solving depth" },
  { id: "career-interest", title: "Career Interest Assessment", note: "Role alignment and preference mapping" }
];

const QUIZ_STORAGE_KEY = "admin_quiz_catalog";
const ASSESSMENT_STORAGE_KEY = "admin_assessment_catalog";

const DEFAULT_QUIZZES_BY_ASSESSMENT = {
  "Personality Assessment": ["Work Style Basics"],
  "Aptitude Assessment": ["Quantitative Reasoning"],
  "Technical Assessment": ["Programming Fundamentals"],
  "Logical Assessment": ["Critical Thinking"],
  "Career Interest Assessment": ["Role Preference Mapping"]
};

const toAssessmentId = (title) => {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `assessment-${Date.now()}`;
};

const normalizeAssessmentItem = (item) => {
  const title = String(item?.title || item?.name || item || "").trim();
  if (!title) {
    return null;
  }

  const note = String(item?.note || "").trim() || "Custom assessment category";
  return {
    id: String(item?.id || "").trim() || toAssessmentId(title),
    title,
    note
  };
};

const getInitialQuizCatalog = () => {
  const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
  if (!raw) return DEFAULT_QUIZZES_BY_ASSESSMENT;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        ...DEFAULT_QUIZZES_BY_ASSESSMENT,
        ...parsed
      };
    }
  } catch {
    // no-op
  }

  return DEFAULT_QUIZZES_BY_ASSESSMENT;
};

const getInitialAssessmentCatalog = () => {
  const fromDefaults = DEFAULT_ASSESSMENTS.map((item) => normalizeAssessmentItem(item)).filter(Boolean);

  const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
  const fromStorage = (() => {
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((item) => normalizeAssessmentItem(item)).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  })();

  const fromQuizCatalogKeys = Object.keys(getInitialQuizCatalog()).map((key) =>
    normalizeAssessmentItem({ title: key, note: "Assessment category" })
  ).filter(Boolean);

  const byLowerTitle = new Map();
  [...fromDefaults, ...fromStorage, ...fromQuizCatalogKeys].forEach((item) => {
    byLowerTitle.set(item.title.toLowerCase(), item);
  });

  return Array.from(byLowerTitle.values());
};

export default function AdminAssessments() {
  const navigate = useNavigate();
  const [quizCatalog, setQuizCatalog] = useState(() => getInitialQuizCatalog());
  const [assessmentCatalog, setAssessmentCatalog] = useState(() => getInitialAssessmentCatalog());
  const [selectedAssessment, setSelectedAssessment] = useState(
    () => getInitialAssessmentCatalog()[0]?.title || ""
  );
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentNote, setAssessmentNote] = useState("");
  const [categoryStatus, setCategoryStatus] = useState({ type: "", text: "" });
  const [isCategorySyncing, setIsCategorySyncing] = useState(false);
  const [quizName, setQuizName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("mcq");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionStatus, setQuestionStatus] = useState({ type: "", text: "" });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiQuestionCount, setAiQuestionCount] = useState(8);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    if (assessmentCatalog.length === 0) {
      setSelectedAssessment("");
      return;
    }

    const exists = assessmentCatalog.some((item) => item.title === selectedAssessment);
    if (!exists) {
      setSelectedAssessment(assessmentCatalog[0].title);
    }
  }, [assessmentCatalog, selectedAssessment]);

  useEffect(() => {
    const syncFromBackend = async () => {
      setIsCategorySyncing(true);

      try {
        const backendCategoryNames = await getAdminAssessmentCategories();
        if (!Array.isArray(backendCategoryNames) || backendCategoryNames.length === 0) {
          return;
        }

        const fromBackend = backendCategoryNames
          .map((item) => normalizeAssessmentItem({ title: item, note: "Assessment category" }))
          .filter(Boolean);

        if (fromBackend.length === 0) {
          return;
        }

        const byLowerTitle = new Map();
        [...assessmentCatalog, ...fromBackend].forEach((item) => {
          byLowerTitle.set(item.title.toLowerCase(), item);
        });

        const mergedCatalog = Array.from(byLowerTitle.values());
        persistAssessmentCatalog(mergedCatalog);

        const mergedQuizCatalog = { ...quizCatalog };
        mergedCatalog.forEach((item) => {
          if (!Array.isArray(mergedQuizCatalog[item.title])) {
            mergedQuizCatalog[item.title] = [];
          }
        });
        persistCatalog(mergedQuizCatalog);
      } catch {
        // keep local catalog if backend is not reachable
      } finally {
        setIsCategorySyncing(false);
      }
    };

    syncFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quizzesForSelectedAssessment = useMemo(
    () => quizCatalog[selectedAssessment] || [],
    [quizCatalog, selectedAssessment]
  );

  const selectedCategoryLabel = useMemo(() => {
    return selectedAssessment.replace(/\s+Assessment$/i, "").trim() || selectedAssessment;
  }, [selectedAssessment]);

  const questionTypes = [
    { value: "mcq", label: "MCQ" },
    { value: "written", label: "Written" },
    { value: "audio", label: "Audio" }
  ];

  const persistCatalog = (catalog) => {
    setQuizCatalog(catalog);
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(catalog));
  };

  const persistAssessmentCatalog = (catalog) => {
    setAssessmentCatalog(catalog);
    localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(catalog));
  };

  const onAddAssessmentCategory = async (event) => {
    event.preventDefault();
    setCategoryStatus({ type: "", text: "" });

    const title = assessmentTitle.trim();
    const note = assessmentNote.trim();

    if (!title) {
      setCategoryStatus({ type: "error", text: "Please enter assessment category name." });
      return;
    }

    const exists = assessmentCatalog.some((item) => item.title.toLowerCase() === title.toLowerCase());
    if (exists) {
      setCategoryStatus({ type: "error", text: "Assessment category already exists." });
      return;
    }

    setIsCategorySyncing(true);

    const nextCategory = {
      id: toAssessmentId(title),
      title,
      note: note || "Custom assessment category"
    };

    let backendSaved = false;
    try {
      await addAdminAssessmentCategory({ name: title, note });
      backendSaved = true;
    } catch (backendError) {
      const errorText = String(backendError?.message || "").toLowerCase();
      const backendEndpointMissing =
        errorText.includes("endpoint is not available") ||
        errorText.includes("not found") ||
        errorText.includes("404");

      if (!backendEndpointMissing) {
        setCategoryStatus({
          type: "error",
          text: backendError?.message || "Unable to add category in backend."
        });
        setIsCategorySyncing(false);
        return;
      }
    }

    const nextCatalog = [...assessmentCatalog, nextCategory];
    persistAssessmentCatalog(nextCatalog);

    const nextQuizCatalog = {
      ...quizCatalog,
      [title]: Array.isArray(quizCatalog[title]) ? quizCatalog[title] : []
    };
    persistCatalog(nextQuizCatalog);

    setSelectedAssessment(title);
    setAssessmentTitle("");
    setAssessmentNote("");
    setCategoryStatus({
      type: "success",
      text: backendSaved ? "Assessment category added." : "Assessment category added."
    });
    setIsCategorySyncing(false);
  };

  const onDeleteAssessmentCategory = async (assessmentTitleToDelete) => {
    if (!assessmentTitleToDelete) {
      return;
    }

    if (assessmentCatalog.length <= 1) {
      setCategoryStatus({ type: "error", text: "At least one assessment category is required." });
      return;
    }

    const confirmed = window.confirm(
      `Delete assessment category "${assessmentTitleToDelete}"? All local quiz/question mappings in this category will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setIsCategorySyncing(true);

    let backendDeleted = false;
    try {
      await deleteAdminAssessmentCategory(assessmentTitleToDelete);
      backendDeleted = true;
    } catch (backendError) {
      const errorText = String(backendError?.message || "").toLowerCase();
      const backendEndpointMissing =
        errorText.includes("endpoint is not available") ||
        errorText.includes("not found") ||
        errorText.includes("404");

      if (!backendEndpointMissing) {
        setCategoryStatus({
          type: "error",
          text: backendError?.message || "Unable to delete category in backend."
        });
        setIsCategorySyncing(false);
        return;
      }
    }

    const nextAssessmentCatalog = assessmentCatalog.filter(
      (item) => item.title.toLowerCase() !== assessmentTitleToDelete.toLowerCase()
    );
    persistAssessmentCatalog(nextAssessmentCatalog);

    const nextQuizCatalog = { ...quizCatalog };
    delete nextQuizCatalog[assessmentTitleToDelete];
    persistCatalog(nextQuizCatalog);

    const storedQuestions = JSON.parse(localStorage.getItem("manualQuizQuestions") || "{}");
    const keysToDelete = Object.keys(storedQuestions).filter((key) =>
      key.toLowerCase().startsWith(`${assessmentTitleToDelete.toLowerCase()}-`)
    );
    keysToDelete.forEach((key) => {
      delete storedQuestions[key];
    });
    localStorage.setItem("manualQuizQuestions", JSON.stringify(storedQuestions));

    if (selectedAssessment.toLowerCase() === assessmentTitleToDelete.toLowerCase()) {
      setSelectedAssessment(nextAssessmentCatalog[0]?.title || "");
      setQuizName("");
      setQuestions([]);
    }

    setCategoryStatus({
      type: "success",
      text: backendDeleted ? "Assessment category deleted." : "Assessment category deleted."
    });
    setIsCategorySyncing(false);
  };

  const loadQuestionsForQuiz = async (assessmentName, quiz) => {
    const normalizedQuiz = String(quiz || "").trim();
    if (!normalizedQuiz) {
      setQuestions([]);
      return;
    }

    try {
      const backendQuestions = await getManualQuestions(assessmentName, normalizedQuiz);
      if (backendQuestions && backendQuestions.length > 0) {
        setQuestions(backendQuestions);
        return;
      }
    } catch {
      // fallback to local storage
    }

    const storedQuestions = JSON.parse(localStorage.getItem("manualQuizQuestions") || "{}");
    const quizKey = `${assessmentName}-${normalizedQuiz}`;
    setQuestions(Array.isArray(storedQuestions[quizKey]) ? storedQuestions[quizKey] : []);
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

  const onAddQuiz = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedQuizName = quizName.trim();
    if (!selectedAssessment) {
      setError("Please create and select an assessment category first.");
      return;
    }

    if (!normalizedQuizName) {
      setError("Please enter a quiz name.");
      return;
    }

    const existing = quizCatalog[selectedAssessment] || [];
    if (existing.some((item) => item.toLowerCase() === normalizedQuizName.toLowerCase())) {
      setError("This quiz name already exists for the selected assessment.");
      return;
    }

    setSaving(true);

    try {
      await createAdminQuiz({
        assessment: selectedAssessment,
        quizName: normalizedQuizName
      });

      const updated = {
        ...quizCatalog,
        [selectedAssessment]: [...existing, normalizedQuizName]
      };

      persistCatalog(updated);
      setQuizName("");
      setMessage("Quiz created successfully in backend.");
    } catch (submitError) {
      setError(submitError?.message || "Failed to create quiz in backend.");
    } finally {
      setSaving(false);
    }
  };

  const onSelectAssessment = (assessmentTitle) => {
    setSelectedAssessment(assessmentTitle);
    setQuestionStatus({ type: "", text: "" });
    setQuestions([]);
  };

  const onSaveQuestion = async (event) => {
    event.preventDefault();

    const normalizedQuizName = quizName.trim();
    if (!selectedAssessment) {
      setQuestionStatus({ type: "error", text: "Please create and select an assessment category first." });
      return;
    }

    if (!normalizedQuizName) {
      setQuestionStatus({ type: "error", text: "Please enter a quiz name first." });
      return;
    }

    if (!questionText.trim()) {
      setQuestionStatus({ type: "error", text: "Please enter a question." });
      return;
    }

    let options = [];
    if (questionType === "mcq") {
      options = [option1.trim(), option2.trim(), option3.trim(), option4.trim()];
      if (options.some((item) => !item)) {
        setQuestionStatus({ type: "error", text: "Please fill all 4 options for MCQ." });
        return;
      }

      if (!correctAnswer.trim() || !options.includes(correctAnswer.trim())) {
        setQuestionStatus({ type: "error", text: "Correct answer must match one option exactly." });
        return;
      }
    } else if (!correctAnswer.trim()) {
      setQuestionStatus({ type: "error", text: "Please enter expected answer/notes." });
      return;
    }

    setIsSavingQuestion(true);
    setQuestionStatus({ type: "", text: "" });

    const questionData = {
      category: selectedAssessment,
      quizName: normalizedQuizName,
      questionText: questionText.trim(),
      questionType,
      options,
      correctAnswer: correctAnswer.trim()
    };

    try {
      await saveManualQuestion(questionData);
      const latest = await getManualQuestions(selectedAssessment, normalizedQuizName);
      setQuestions(Array.isArray(latest) ? latest : []);

      setQuestionText("");
      setOption1("");
      setOption2("");
      setOption3("");
      setOption4("");
      setCorrectAnswer("");

      setQuestionStatus({
        type: "success",
        text: "Question saved to database."
      });
    } catch (saveError) {
      setQuestionStatus({ type: "error", text: saveError?.message || "Failed to save question in backend." });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const onDeleteQuestion = (questionId) => {
    const normalizedQuizName = quizName.trim();
    if (!normalizedQuizName) {
      return;
    }

    const storedQuestions = JSON.parse(localStorage.getItem("manualQuizQuestions") || "{}");
    const quizKey = `${selectedAssessment}-${normalizedQuizName}`;
    const current = Array.isArray(storedQuestions[quizKey]) ? storedQuestions[quizKey] : [];
    const next = current.filter((item) => String(item.id) !== String(questionId));
    storedQuestions[quizKey] = next;
    localStorage.setItem("manualQuizQuestions", JSON.stringify(storedQuestions));
    setQuestions(next);
    setQuestionStatus({ type: "success", text: "Question deleted." });
  };

  const onLoadQuizQuestions = () => {
    loadQuestionsForQuiz(selectedAssessment, quizName);
  };

  const onSubmitQuiz = async () => {
    const normalizedQuizName = quizName.trim();
    if (!selectedAssessment) {
      setQuestionStatus({ type: "error", text: "Please create and select an assessment category first." });
      return;
    }

    if (!normalizedQuizName) {
      setQuestionStatus({ type: "error", text: "Please enter a quiz name before submitting." });
      return;
    }

    if (questions.length === 0) {
      setQuestionStatus({ type: "error", text: "Add at least one question before submitting." });
      return;
    }

    setIsSubmittingQuiz(true);
    setQuestionStatus({ type: "", text: "" });

    try {
      await createAdminQuiz({ assessment: selectedAssessment, quizName: normalizedQuizName });
    } catch (publishError) {
      const publishMessage = String(publishError?.message || "").toLowerCase();
      const quizAlreadyExists = publishMessage.includes("quiz already exists")
        || publishMessage.includes("already exists");

      if (!quizAlreadyExists) {
        setQuestionStatus({
          type: "error",
          text: publishError?.message || "Failed to publish quiz to backend."
        });
        setIsSubmittingQuiz(false);
        return;
      }

      // Existing quizzes should still allow submit/publish of saved questions.
      const existing = quizCatalog[selectedAssessment] || [];
      const exists = existing.some((item) => item.toLowerCase() === normalizedQuizName.toLowerCase());
      const updatedCatalog = {
        ...quizCatalog,
        [selectedAssessment]: exists ? existing : [...existing, normalizedQuizName]
      };
      persistCatalog(updatedCatalog);

      setQuestionStatus({
        type: "success",
        text: "Quiz already exists. Questions were saved to this quiz successfully."
      });
      setIsSubmittingQuiz(false);
      return;
    }

    const existing = quizCatalog[selectedAssessment] || [];
    const exists = existing.some((item) => item.toLowerCase() === normalizedQuizName.toLowerCase());
    const updatedCatalog = {
      ...quizCatalog,
      [selectedAssessment]: exists ? existing : [...existing, normalizedQuizName]
    };
    persistCatalog(updatedCatalog);

    setQuestionStatus({
      type: "success",
      text: "Quiz submitted and published to user flow."
    });

    setIsSubmittingQuiz(false);
  };

  const onGenerateAiQuiz = async () => {
    const normalizedQuizName = quizName.trim();

    if (!selectedAssessment) {
      setQuestionStatus({ type: "error", text: "Please select an assessment category first." });
      return;
    }

    if (!normalizedQuizName) {
      setQuestionStatus({ type: "error", text: "Enter quiz name to generate with AI." });
      return;
    }

    setIsGeneratingAi(true);
    setQuestionStatus({ type: "", text: "" });

    try {
      const result = await generateAiAssessmentForAdmin({
        category: selectedAssessment,
        quizTitle: normalizedQuizName,
        topic: aiTopic.trim() || selectedCategoryLabel,
        difficulty: aiDifficulty,
        questionCount: aiQuestionCount,
        replaceExisting: true
      });

      const publishedTitle = String(result?.quizTitle || normalizedQuizName).trim();
      const generatedQuestions = Array.isArray(result?.questions) ? result.questions : [];

      const existing = quizCatalog[selectedAssessment] || [];
      const exists = existing.some((item) => item.toLowerCase() === publishedTitle.toLowerCase());
      const nextCatalog = {
        ...quizCatalog,
        [selectedAssessment]: exists ? existing : [...existing, publishedTitle]
      };

      persistCatalog(nextCatalog);
      setQuizName(publishedTitle);
      setQuestions(generatedQuestions);
      setQuestionStatus({
        type: "success",
        text: result?.message || "AI quiz generated and published for users."
      });
    } catch (generationError) {
      setQuestionStatus({
        type: "error",
        text: generationError?.message || "Failed to generate AI quiz."
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-identity">
          <div className="admin-avatar" aria-hidden="true">A</div>
          <div>
            <h1 className="admin-title">Assessments</h1>
            <p className="admin-subtitle">Manage assessment categories and open dashboard workflows</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle />
          <button type="button" onClick={onLogout} className="admin-logout-btn">Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <nav className="admin-nav-pills" aria-label="Admin navigation">
          <Link to="/admin" className="admin-nav-pill">Overview</Link>
          <span className="admin-nav-pill admin-nav-pill-active">Assessments</span>
          <Link to="/admin/careers" className="admin-nav-pill">Careers</Link>
          <Link to="/admin/analytics" className="admin-nav-pill">Student Results</Link>
          <Link to="/admin/scores" className="admin-nav-pill">View Scores</Link>
          <Link to="/admin/users" className="admin-nav-pill">Make Admin</Link>
        </nav>

        <section className="admin-section-head">
          <h2 className="admin-section-title">Assessment Library</h2>
          <p className="admin-section-subtitle">Select an assessment, add quiz by name, then open it in Admin Dashboard.</p>
        </section>

        <section className="admin-assessment-editor" aria-label="Assessment category manager">
          <form onSubmit={onAddAssessmentCategory} className="admin-assessment-form">
            <label className="admin-assessment-label" htmlFor="assessment-title-input">
              Add Assessment Category
            </label>

            <div className="admin-assessment-input-row">
              <input
                id="assessment-title-input"
                className="admin-assessment-input"
                placeholder="Category name"
                value={assessmentTitle}
                onChange={(event) => setAssessmentTitle(event.target.value)}
              />
              <button type="submit" className="admin-assessment-add-btn">Add Category</button>
            </div>

            <input
              className="admin-assessment-input"
              placeholder="Short description (optional)"
              value={assessmentNote}
              onChange={(event) => setAssessmentNote(event.target.value)}
            />

            {categoryStatus.text ? (
              <div className={`message-banner ${categoryStatus.type}`}>
                {categoryStatus.text}
              </div>
            ) : null}

            {isCategorySyncing ? <p className="admin-assessment-note">Syncing categories with backend...</p> : null}
          </form>
        </section>

        <section className="admin-assessments-grid" aria-label="Assessment categories">
          {assessmentCatalog.map((item) => (
            <article
              key={item.id}
              className={`admin-assessment-card ${selectedAssessment === item.title ? "admin-assessment-card-selected" : ""}`}
              onClick={() => onSelectAssessment(item.title)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectAssessment(item.title);
                }
              }}
            >
              <h3 className="admin-assessment-title">{item.title}</h3>
              <p className="admin-assessment-note">{item.note}</p>
              <span className="admin-assessment-cta">
                {selectedAssessment === item.title ? "Selected" : "Select"}
              </span>
              <button
                type="button"
                className="admin-careers-danger-btn"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDeleteAssessmentCategory(item.title);
                }}
              >
                Delete
              </button>
            </article>
          ))}
        </section>

        <section className="admin-assessment-editor" aria-label="Quiz editor">
          <form onSubmit={onAddQuiz} className="admin-assessment-form">
            <label className="admin-assessment-label" htmlFor="quiz-name-input">
              Add Quiz Name for {selectedAssessment}
            </label>

            <div className="admin-assessment-input-row">
              <input
                id="quiz-name-input"
                className="admin-assessment-input"
                placeholder="Enter quiz name"
                value={quizName}
                onChange={(event) => {
                  setQuizName(event.target.value);
                  setQuestionStatus({ type: "", text: "" });
                }}
              />
              <button type="submit" className="admin-assessment-add-btn">Add Quiz</button>
            </div>

            {error ? <p className="admin-assessment-error">{error}</p> : null}
            {message ? <p className="admin-assessment-success">{message}</p> : null}

            <button
              type="button"
              className="admin-assessment-open-btn"
              onClick={() => navigate("/admin", { state: { selectedAssessment } })}
              disabled={saving}
            >
              Open Selected Assessment in Dashboard
            </button>

            <div className="admin-manual-inline-head" style={{ marginTop: "1rem" }}>
              <h3 className="admin-assessment-list-title">AI Generate & Publish</h3>
              <p className="admin-assessment-note">Create questions instantly and assign this assessment to users.</p>
            </div>

            <div className="admin-assessment-input-row">
              <input
                className="admin-assessment-input"
                placeholder="Topic focus (optional)"
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
              />

              <select
                className="admin-assessment-input"
                value={aiDifficulty}
                onChange={(event) => setAiDifficulty(event.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="admin-assessment-input-row">
              <input
                type="number"
                min={3}
                max={20}
                className="admin-assessment-input"
                value={aiQuestionCount}
                onChange={(event) => setAiQuestionCount(Number(event.target.value) || 8)}
              />
              <button
                type="button"
                className="admin-assessment-add-btn"
                onClick={onGenerateAiQuiz}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? "Generating..." : "Generate Quiz with AI"}
              </button>
            </div>
          </form>

          <div className="admin-assessment-quiz-list">
            <h3 className="admin-assessment-list-title">Quizzes</h3>
            {!quizzesForSelectedAssessment.length ? <p className="admin-assessment-empty">No quizzes yet.</p> : null}

            {quizzesForSelectedAssessment.map((item) => (
              <div key={item} className="admin-assessment-quiz-item">
                <span>{item}</span>
                <div className="admin-assessment-quiz-item-actions">
                  <button
                    type="button"
                    className="admin-assessment-open-btn"
                    onClick={() => {
                      setQuizName(item);
                      loadQuestionsForQuiz(selectedAssessment, item);
                    }}
                    disabled={saving}
                  >
                    Edit Questions
                  </button>
                  <button
                    type="button"
                    className="admin-assessment-open-btn"
                    onClick={() => navigate("/admin", { state: { selectedAssessment, selectedQuiz: item } })}
                    disabled={saving}
                  >
                    Open in Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-manual-inline-wrap">
            <div className="admin-manual-inline-head">
              <h3 className="admin-assessment-list-title">Manual Quiz Editor (Inline)</h3>
              <p className="admin-assessment-note">Assessment: {selectedCategoryLabel}</p>
            </div>

            {questionStatus.text ? (
              <div className={`message-banner ${questionStatus.type}`}>
                {questionStatus.text}
              </div>
            ) : null}

            <div className="manual-quiz-layout">
              <div className="question-form-section">
                <form onSubmit={onSaveQuestion} className="question-form">
                  <div className="form-group">
                    <label htmlFor="admin-inline-quiz">Quiz Name</label>
                    <div className="admin-assessment-input-row">
                      <input
                        id="admin-inline-quiz"
                        type="text"
                        className="form-input"
                        placeholder="Enter quiz name"
                        value={quizName}
                        onChange={(event) => setQuizName(event.target.value)}
                        required
                      />
                      <button type="button" className="admin-assessment-open-btn" onClick={onLoadQuizQuestions}>
                        Load
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-inline-question">Question</label>
                    <textarea
                      id="admin-inline-question"
                      value={questionText}
                      onChange={(event) => setQuestionText(event.target.value)}
                      placeholder="Enter your question"
                      className="form-textarea"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-inline-type">Question Type</label>
                    <select
                      id="admin-inline-type"
                      value={questionType}
                      onChange={(event) => setQuestionType(event.target.value)}
                      className="form-select"
                    >
                      {questionTypes.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>

                  {questionType === "mcq" ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="admin-inline-option1">Option 1</label>
                        <input id="admin-inline-option1" className="form-input" value={option1} onChange={(event) => setOption1(event.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-inline-option2">Option 2</label>
                        <input id="admin-inline-option2" className="form-input" value={option2} onChange={(event) => setOption2(event.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-inline-option3">Option 3</label>
                        <input id="admin-inline-option3" className="form-input" value={option3} onChange={(event) => setOption3(event.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="admin-inline-option4">Option 4</label>
                        <input id="admin-inline-option4" className="form-input" value={option4} onChange={(event) => setOption4(event.target.value)} required />
                      </div>
                    </>
                  ) : null}

                  <div className="form-group">
                    <label htmlFor="admin-inline-answer">
                      {questionType === "mcq" ? "Correct Answer" : "Expected Answer / Notes"}
                    </label>
                    <input
                      id="admin-inline-answer"
                      className="form-input"
                      value={correctAnswer}
                      onChange={(event) => setCorrectAnswer(event.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="save-question-btn" disabled={isSavingQuestion}>
                    {isSavingQuestion ? "Saving..." : "Save Question"}
                  </button>
                </form>
              </div>

              <div className="question-list-section">
                <h3>Questions for: {quizName || "(No quiz selected)"}</h3>
                {questions.length === 0 ? (
                  <p className="no-questions">No questions added yet.</p>
                ) : (
                  <div className="question-list">
                    {questions.map((question, index) => (
                      <div key={question.id || `${index}-${question.questionText}`} className="question-item">
                        <div className="question-header">
                          <div className="question-header-left">
                            <span className="question-number">Q{index + 1}</span>
                            <span className="question-type-chip">{(question.questionType || "mcq").toUpperCase()}</span>
                          </div>
                          <button type="button" onClick={() => onDeleteQuestion(question.id)} className="delete-question-btn">✕</button>
                        </div>
                        <p className="question-text">{question.questionText || question.question}</p>
                      </div>
                    ))}
                  </div>
                )}

                {questions.length > 0 ? (
                  <div className="question-list-footer">
                    <p className="question-count">Total Questions: {questions.length}</p>
                    <button type="button" className="submit-quiz-btn" onClick={onSubmitQuiz} disabled={isSubmittingQuiz}>
                      {isSubmittingQuiz ? "Submitting Quiz..." : "Submit Quiz"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
