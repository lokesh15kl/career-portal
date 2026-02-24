import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  attemptQuiz,
  submitQuiz,
  submitQuizWithTypedQuestions
} from "../services/api";
import { getCareerRecommendations } from "../services/recommendations";
import { saveAttempt } from "../services/userProgress";

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  const category = location.state?.category || "";
  const quizTitle = location.state?.quizTitle || "";

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recordingByQuestion, setRecordingByQuestion] = useState({});
  const [audioResponses, setAudioResponses] = useState({});

  const mediaRecorderByQuestionRef = useRef({});
  const mediaStreamByQuestionRef = useRef({});
  const chunksByQuestionRef = useRef({});
  const audioResponsesRef = useRef({});

  useEffect(() => {
    const loadQuiz = async () => {
      if (!category || !quizTitle) {
        setError("Invalid quiz selection. Please go back to dashboard.");
        setLoading(false);
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
  }, [category, quizTitle]);

  const totalQuestions = useMemo(() => questions.length, [questions]);

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
        <div className="quiz-header-row">
          <div>
            <h1 className="quiz-title">Assessment Quiz</h1>
            <p className="quiz-subtitle">{category} • {quizTitle}</p>
            <p className="quiz-meta">Questions: {totalQuestions}</p>
          </div>
          <Link to="/dashboard" className="quiz-back-link">Back</Link>
        </div>

        {loading ? <p className="quiz-loading">Loading questions...</p> : null}

        {!loading && questions.map((question, index) => (
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

        {error ? <p className="quiz-error">{error}</p> : null}

        {!loading && totalQuestions > 0 ? (
          <button onClick={onSubmit} className="quiz-submit-btn" disabled={submitting || score !== null}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : null}

        {score !== null ? (
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
              <button onClick={() => navigate("/results")} className="quiz-primary-btn">View My Results</button>
              <button onClick={() => navigate("/careers")} className="quiz-secondary-btn">Explore Careers</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
