import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  attemptQuiz,
  submitQuiz,
  submitQuizWithTypedQuestions
} from "../services/api";
import {
  attemptSafeExamBrowserLaunch,
  buildSafeExamBrowserLaunchUrl,
  createQuizKey,
  isInsideSafeExamBrowser
} from "../services/safeExamBrowser";
import { getCareerRecommendations } from "../services/recommendations";
import { saveAttempt } from "../services/userProgress";

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);

  const category = location.state?.category || params.get("category") || "";
  const quizTitle = location.state?.quizTitle || params.get("quizTitle") || "";
  const launchMode = String(location.state?.launchMode || params.get("mode") || "assessment").toLowerCase();
  const isAiPracticeMode = launchMode === "practice";
  const quizKey = useMemo(() => createQuizKey({ category, quizTitle }), [category, quizTitle]);
  const insideSafeExamBrowser = isInsideSafeExamBrowser();
  const shouldRequireSeb = !isAiPracticeMode
    && String(import.meta.env.VITE_REQUIRE_SEB ?? "false").toLowerCase() !== "false";
  const shouldBlockForSeb = shouldRequireSeb && !insideSafeExamBrowser;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recordingByQuestion, setRecordingByQuestion] = useState({});
  const [audioResponses, setAudioResponses] = useState({});
  const [showSebNotice, setShowSebNotice] = useState(false);
  const [sebLaunchError, setSebLaunchError] = useState("");
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [isExamTerminated, setIsExamTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");

  const terminateExam = (reason) => {
    setIsExamTerminated(true);
    setTerminationReason(reason || "Exam was terminated.");
    setSubmitting(false);
    setLoading(false);
    setShowSebNotice(false);
    setShowFullscreenPrompt(false);
  };

  const requestFullscreenMode = async () => {
    if (typeof document === "undefined") {
      return false;
    }

    if (document.fullscreenElement) {
      setShowFullscreenPrompt(false);
      return true;
    }

    const rootElement = document.documentElement;
    if (!rootElement?.requestFullscreen) {
      setShowFullscreenPrompt(true);
      return false;
    }

    try {
      await rootElement.requestFullscreen();
      setShowFullscreenPrompt(false);
      return true;
    } catch {
      setShowFullscreenPrompt(true);
      return false;
    }
  };

  useEffect(() => {
    if (!isAiPracticeMode) {
      setShowFullscreenPrompt(false);
      hadFullscreenRef.current = false;
      return;
    }

    const syncFullscreenState = () => {
      const inFullscreen = Boolean(document.fullscreenElement);

      if (inFullscreen) {
        hadFullscreenRef.current = true;
        setShowFullscreenPrompt(false);
        return;
      }

      setShowFullscreenPrompt(true);
      if (hadFullscreenRef.current && !isExamTerminated && score === null) {
        terminateExam("Exam terminated: Fullscreen mode was exited.");
      }
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    requestFullscreenMode();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [isAiPracticeMode, isExamTerminated, score]);

  useEffect(() => {
    if (isExamTerminated || score !== null) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      terminateExam("Exam terminated: Escape key was pressed.");
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isExamTerminated, score]);

  useEffect(() => {
    if (!category || !quizTitle || insideSafeExamBrowser || isAiPracticeMode) {
      setShowSebNotice(false);
      return;
    }

    const launched = attemptSafeExamBrowserLaunch({
      examUrl: window.location.href,
      quizKey
    });

    setShowSebNotice(!launched);
  }, [category, quizTitle, quizKey, insideSafeExamBrowser, isAiPracticeMode]);

  const onLaunchSeb = () => {
    const launchUrl = buildSafeExamBrowserLaunchUrl(window.location.href);
    if (!launchUrl) {
      setSebLaunchError("SEB direct launch needs a configured .seb link. Ask admin to set VITE_SEB_LAUNCH_URL.");
      return;
    }

    setSebLaunchError("");
    window.location.assign(launchUrl);
  };

  const mediaRecorderByQuestionRef = useRef({});
  const mediaStreamByQuestionRef = useRef({});
  const chunksByQuestionRef = useRef({});
  const audioResponsesRef = useRef({});
  const hadFullscreenRef = useRef(false);

  useEffect(() => {
    const loadQuiz = async () => {
      if (isExamTerminated) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      if (!category || !quizTitle) {
        setError("Invalid quiz selection. Please go back to dashboard.");
        setLoading(false);
        return;
      }

      if (shouldBlockForSeb) {
        setLoading(false);
        setQuestions([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await attemptQuiz(category, quizTitle);
        if (!Array.isArray(data) || data.length === 0) {
          setError("No questions found for this quiz.");
          setQuestions([]);
          return;
        }
        setQuestions(data);
      } catch (loadError) {
        setError(loadError.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [category, quizTitle, shouldBlockForSeb, isExamTerminated]);

  const totalQuestions = useMemo(() => questions.length, [questions]);

  const reviewRows = useMemo(() => {
    if (score === null) {
      return [];
    }

    return questions.map((question, index) => {
      const questionKey = `q${question.id}`;
      const userAnswer = String(answers[questionKey] || "").trim();
      const expectedAnswer = String(question.correctAnswer || "").trim();
      const questionType = String(question.questionType || "mcq").toLowerCase();

      const isCorrect = questionType === "audio"
        ? userAnswer.length > 0 && userAnswer.toLowerCase().includes(expectedAnswer.toLowerCase())
        : userAnswer.localeCompare(expectedAnswer, undefined, { sensitivity: "accent" }) === 0;

      const explanation = questionType === "mcq"
        ? `The correct option is "${expectedAnswer}" because it best matches the concept asked in this question.`
        : `Your response is checked against the expected answer key: "${expectedAnswer}".`;

      const improvement = isCorrect
        ? "Great job. Keep practicing similar questions to improve speed and consistency."
        : `Review this concept, understand why "${expectedAnswer}" is correct, then retry similar ${questionType.toUpperCase()} questions.`;

      return {
        id: question.id,
        number: index + 1,
        questionText: question.question,
        questionType,
        userAnswer: userAnswer || "(No answer)",
        expectedAnswer: expectedAnswer || "(Not configured)",
        isCorrect,
        explanation,
        improvement
      };
    });
  }, [answers, questions, score]);

  const onSelectAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [`q${questionId}`]: value }));
  };

  const stopMediaStream = (questionKey) => {
    const stream = mediaStreamByQuestionRef.current[questionKey];
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      delete mediaStreamByQuestionRef.current[questionKey];
    }
  };

  const startAudioRecording = async (questionId) => {
    const questionKey = `q${questionId}`;
    setError("");

    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    if (recordingByQuestion[questionKey]) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      chunksByQuestionRef.current[questionKey] = [];
      mediaStreamByQuestionRef.current[questionKey] = stream;
      mediaRecorderByQuestionRef.current[questionKey] = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksByQuestionRef.current[questionKey].push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const chunks = chunksByQuestionRef.current[questionKey] || [];
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });

        setAudioResponses((prev) => {
          const previous = prev[questionKey];
          if (previous?.url) {
            URL.revokeObjectURL(previous.url);
          }

          return {
            ...prev,
            [questionKey]: {
              blob,
              url: URL.createObjectURL(blob),
              mimeType: blob.type
            }
          };
        });

        setAnswers((prev) => ({
          ...prev,
          [questionKey]: `AUDIO_RECORDED:${blob.type || "audio/webm"}:${blob.size}`
        }));

        setRecordingByQuestion((prev) => ({ ...prev, [questionKey]: false }));
        stopMediaStream(questionKey);
        delete chunksByQuestionRef.current[questionKey];
        delete mediaRecorderByQuestionRef.current[questionKey];
      };

      mediaRecorder.start();
      setRecordingByQuestion((prev) => ({ ...prev, [questionKey]: true }));
    } catch {
      setError("Microphone access is required to record audio response.");
    }
  };

  const stopAudioRecording = (questionId) => {
    const questionKey = `q${questionId}`;
    const mediaRecorder = mediaRecorderByQuestionRef.current[questionKey];

    if (!mediaRecorder) {
      return;
    }

    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  useEffect(() => {
    audioResponsesRef.current = audioResponses;
  }, [audioResponses]);

  useEffect(() => {
    return () => {
      Object.keys(mediaRecorderByQuestionRef.current).forEach((questionKey) => {
        const mediaRecorder = mediaRecorderByQuestionRef.current[questionKey];
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      });

      Object.keys(mediaStreamByQuestionRef.current).forEach((questionKey) => {
        stopMediaStream(questionKey);
      });

      Object.values(audioResponsesRef.current).forEach((response) => {
        if (response?.url) {
          URL.revokeObjectURL(response.url);
        }
      });
    };
  }, []);

  const onSubmit = async () => {
    setError("");

    if (Object.keys(answers).length !== questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const submissionAnswers = Object.entries(answers).reduce((acc, [key, value]) => {
        acc[key] = typeof value === "string" ? value : String(value ?? "");
        return acc;
      }, {});

      const hasAudioResponses = Object.values(audioResponses).some((item) => item?.blob instanceof Blob);
      const hasWrittenQuestions = questions.some(
        (item) => String(item?.questionType || "mcq").toLowerCase() === "written"
      );

      const result = hasWrittenQuestions
        ? await submitQuizWithTypedQuestions({
            answers: submissionAnswers,
            questions,
            audioResponses,
            category,
            quizTitle
          })
        : hasAudioResponses
        ? await submitQuizWithTypedQuestions({
            answers: submissionAnswers,
            questions,
            audioResponses,
            category,
            quizTitle
          })
        : await submitQuiz(submissionAnswers);
      const numericScore = Number(result) || 0;
      setScore(numericScore);

      const recommendationList = getCareerRecommendations({
        category,
        score: numericScore,
        totalQuestions
      });
      setRecommendations(recommendationList);

      saveAttempt({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
        category,
        quizTitle,
        score: numericScore,
        totalQuestions,
        recommendations: recommendationList
      });
    } catch (submitError) {
      setError(submitError.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quiz-shell">
      <div className="quiz-card">
        {showSebNotice ? (
          <div className="quiz-seb-notice" role="status">
            <p className="quiz-seb-notice-text">
              This assessment is intended to run in Safe Exam Browser. If SEB did not open automatically,
              use the button below.
            </p>
            <button
              type="button"
              className="quiz-seb-open-btn"
              onClick={onLaunchSeb}
            >
              Open in Safe Exam Browser
            </button>
            {sebLaunchError ? <p className="quiz-error-text">{sebLaunchError}</p> : null}
          </div>
        ) : null}

        {isAiPracticeMode && showFullscreenPrompt ? (
          <div className="quiz-fullscreen-notice" role="status">
            <p className="quiz-fullscreen-notice-text">
              AI practice runs in fullscreen mode. If it is not fullscreen yet, use the button below.
            </p>
            <button
              type="button"
              className="quiz-fullscreen-open-btn"
              onClick={requestFullscreenMode}
            >
              Open Full Screen
            </button>
          </div>
        ) : null}

        <div className="quiz-header-row">
          <div>
            <h1 className="quiz-title">Assessment Quiz</h1>
            <p className="quiz-subtitle">{category} • {quizTitle}</p>
            <p className="quiz-meta">Questions: {totalQuestions}</p>
          </div>
          <Link to="/dashboard" className="quiz-back-link">Back</Link>
        </div>

        {isExamTerminated ? (
          <div className="quiz-terminated-box" role="alert" aria-live="assertive">
            <h2 className="quiz-terminated-title">Exam Closed</h2>
            <p className="quiz-terminated-copy">{terminationReason}</p>
            <button
              type="button"
              className="quiz-secondary-btn"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              Return to Dashboard
            </button>
          </div>
        ) : null}

        {!isExamTerminated && shouldBlockForSeb ? (
          <div className="quiz-seb-blocker" role="alert" aria-live="assertive">
            <h2 className="quiz-seb-blocker-title">Safe Exam Browser Required</h2>
            <p className="quiz-seb-blocker-copy">
              This assessment is locked until opened inside Safe Exam Browser.
            </p>
            <button
              type="button"
              className="quiz-seb-open-btn"
              onClick={onLaunchSeb}
            >
              Launch in Safe Exam Browser
            </button>
            {sebLaunchError ? <p className="quiz-error-text">{sebLaunchError}</p> : null}
          </div>
        ) : null}

        {!isExamTerminated && loading ? <p className="quiz-loading">Loading questions...</p> : null}

        {!isExamTerminated && !loading && !shouldBlockForSeb && questions.map((question, index) => (
          <div key={question.id} className="quiz-question-block">
            <p className="quiz-question-text">{index + 1}. {question.question}</p>
            {(question.questionType || "mcq") === "mcq" ? (
              [question.option1, question.option2, question.option3, question.option4]
                .filter(Boolean)
                .map((option) => (
                  <label key={option} className="quiz-option-label">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={option}
                      checked={answers[`q${question.id}`] === option}
                      onChange={() => onSelectAnswer(question.id, option)}
                    />
                    <span className="quiz-option-text">{option}</span>
                  </label>
                ))
            ) : (question.questionType || "").toLowerCase() === "audio" ? (
              <div className="quiz-audio-answer-wrap">
                <button
                  type="button"
                  className="quiz-audio-record-btn"
                  onClick={() =>
                    recordingByQuestion[`q${question.id}`]
                      ? stopAudioRecording(question.id)
                      : startAudioRecording(question.id)
                  }
                >
                  {recordingByQuestion[`q${question.id}`] ? "Stop Recording" : "Record with Mic"}
                </button>

                {audioResponses[`q${question.id}`]?.url ? (
                  <audio
                    className="quiz-audio-player"
                    controls
                    src={audioResponses[`q${question.id}`].url}
                  />
                ) : null}
              </div>
            ) : (
              <div className="quiz-text-answer-wrap">
                <textarea
                  className="quiz-text-answer"
                  rows={3}
                  placeholder={
                    (question.questionType || "").toLowerCase() === "audio"
                      ? "Type your response for this audio question"
                      : "Type your answer"
                  }
                  value={answers[`q${question.id}`] || ""}
                  onChange={(event) => onSelectAnswer(question.id, event.target.value)}
                />
              </div>
            )}
          </div>
        ))}

        {!isExamTerminated && error ? <p className="quiz-error">{error}</p> : null}

        {!isExamTerminated && !loading && !shouldBlockForSeb && totalQuestions > 0 ? (
          <button type="button" onClick={onSubmit} className="quiz-submit-btn" disabled={submitting || score !== null}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : null}

        {!isExamTerminated && !shouldBlockForSeb && score !== null ? (
          <div className="quiz-score-box">
            <h2 className="quiz-score-title">Your Score: {score} / {totalQuestions}</h2>

            {recommendations.length > 0 ? (
              <div className="quiz-recommendation-wrap">
                <p className="quiz-rec-title">Recommended Career Paths</p>
                {recommendations.map((item) => (
                  <div key={item.title} className="quiz-rec-card">
                    <h4 className="quiz-rec-role">{item.title}</h4>
                    <p className="quiz-rec-reason">{item.reason}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="quiz-result-actions">
              <button
                type="button"
                onClick={() =>
                  navigate("/results", {
                    state: {
                      latestAttempt: {
                        id: `${Date.now()}-view`,
                        timestamp: Date.now(),
                        category,
                        quizTitle,
                        score,
                        totalQuestions,
                        recommendations
                      }
                    }
                  })
                }
                className="quiz-primary-btn"
              >
                View My Results
              </button>
              <button type="button" onClick={() => navigate("/careers")} className="quiz-secondary-btn">Explore Careers</button>
            </div>

            {reviewRows.length > 0 ? (
              <div className="quiz-recommendation-wrap" style={{ marginTop: "1rem" }}>
                <p className="quiz-rec-title">Answer Review and Improvement Guide</p>
                {reviewRows.map((item) => (
                  <div
                    key={item.id}
                    className="quiz-rec-card"
                    style={{ borderLeft: item.isCorrect ? "4px solid #22c55e" : "4px solid #ef4444" }}
                  >
                    <h4 className="quiz-rec-role">
                      Q{item.number} ({item.questionType.toUpperCase()}) - {item.isCorrect ? "Correct" : "Needs Improvement"}
                    </h4>
                    <p className="quiz-rec-reason"><strong>Question:</strong> {item.questionText}</p>
                    <p className="quiz-rec-reason"><strong>Your answer:</strong> {item.userAnswer}</p>
                    <p className="quiz-rec-reason"><strong>Correct answer:</strong> {item.expectedAnswer}</p>
                    <p className="quiz-rec-reason"><strong>Explanation:</strong> {item.explanation}</p>
                    <p className="quiz-rec-reason"><strong>How to improve:</strong> {item.improvement}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
