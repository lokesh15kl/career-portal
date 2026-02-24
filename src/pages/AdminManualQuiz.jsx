import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { logout, saveManualQuestion, getManualQuestions, createAdminQuiz } from '../services/api';

const QUIZ_STORAGE_KEY = 'admin_quiz_catalog';

const AdminManualQuiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Form state
  const [category, setCategory] = useState(searchParams.get('category') || 'Personality');
  const [quizName, setQuizName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [option4, setOption4] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  
  // Question list for current quiz
  const [questions, setQuestions] = useState([]);
  
  // UI state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const categories = ['Personality', 'Career Interest', 'Skill Assessment', 'Value Assessment', 'Other'];
  const questionTypes = [
    { value: 'mcq', label: 'MCQ' },
    { value: 'written', label: 'Written' },
    { value: 'audio', label: 'Audio' }
  ];

  const loadQuestionsForQuiz = async (name) => {
    if (!name.trim()) return;
    
    try {
      // Try backend first
      const backendQuestions = await getManualQuestions(category, name);
      if (backendQuestions && backendQuestions.length > 0) {
        setQuestions(backendQuestions);
        return;
      }
    } catch {
      console.log('Backend fetch failed, loading from localStorage');
    }
    
    // Fallback to localStorage
    const storedQuestions = JSON.parse(localStorage.getItem('manualQuizQuestions') || '{}');
    const quizKey = `${category}-${name}`;
    setQuestions(storedQuestions[quizKey] || []);
  };

  useEffect(() => {
    // Load questions for current quiz if quizName is set
    if (quizName.trim()) {
      loadQuestionsForQuiz(quizName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizName, category]);

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!quizName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a quiz name' });
      return;
    }
    if (!questionText.trim()) {
      setMessage({ type: 'error', text: 'Please enter a question' });
      return;
    }

    let options = [];
    if (questionType === 'mcq') {
      if (!option1.trim() || !option2.trim() || !option3.trim() || !option4.trim()) {
        setMessage({ type: 'error', text: 'Please fill all 4 options for MCQ' });
        return;
      }
      if (!correctAnswer.trim()) {
        setMessage({ type: 'error', text: 'Please enter the correct answer' });
        return;
      }

      options = [option1.trim(), option2.trim(), option3.trim(), option4.trim()];
      if (!options.includes(correctAnswer.trim())) {
        setMessage({ type: 'error', text: 'Correct answer must match one of the 4 options exactly' });
        return;
      }
    } else {
      if (!correctAnswer.trim()) {
        setMessage({ type: 'error', text: 'Please enter expected answer/notes' });
        return;
      }
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const questionData = {
        category,
        quizName: quizName.trim(),
        questionText: questionText.trim(),
        questionType,
        options: options,
        correctAnswer: correctAnswer.trim()
      };

      // Try backend save using API service
      let success = false;
      try {
        await saveManualQuestion(questionData);
        success = true;
        console.log('Question saved to backend successfully');
      } catch (backendError) {
        console.log('Backend save failed:', backendError.message);
      }

      // Also save to localStorage as backup
      const storedQuestions = JSON.parse(localStorage.getItem('manualQuizQuestions') || '{}');
      const quizKey = `${category}-${quizName.trim()}`;
      
      if (!storedQuestions[quizKey]) {
        storedQuestions[quizKey] = [];
      }
      
      const newQuestion = {
        id: Date.now(),
        ...questionData,
        createdAt: new Date().toISOString()
      };
      
      storedQuestions[quizKey].push(newQuestion);
      localStorage.setItem('manualQuizQuestions', JSON.stringify(storedQuestions));
      
      // Update displayed questions
      setQuestions(storedQuestions[quizKey]);
      
      // Clear form fields (keep category and quizName)
      setQuestionText('');
      setOption1('');
      setOption2('');
      setOption3('');
      setOption4('');
      setCorrectAnswer('');
      
      setMessage({ 
        type: 'success', 
        text: success 
          ? 'Question saved successfully to database!' 
          : 'Question saved locally (backend connection pending)'
      });
    } catch (error) {
      console.error('Error saving question:', error);
      setMessage({ type: 'error', text: 'Failed to save question. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    const storedQuestions = JSON.parse(localStorage.getItem('manualQuizQuestions') || '{}');
    const quizKey = `${category}-${quizName.trim()}`;
    
    if (storedQuestions[quizKey]) {
      storedQuestions[quizKey] = storedQuestions[quizKey].filter(q => q.id !== questionId);
      localStorage.setItem('manualQuizQuestions', JSON.stringify(storedQuestions));
      setQuestions(storedQuestions[quizKey]);
      setMessage({ type: 'success', text: 'Question deleted' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmitQuiz = async () => {
    const normalizedQuizName = quizName.trim();

    if (!normalizedQuizName) {
      setMessage({ type: 'error', text: 'Please enter a quiz name before submitting the quiz' });
      return;
    }

    if (questions.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one question before submitting the quiz' });
      return;
    }

    setIsSubmittingQuiz(true);
    setMessage({ type: '', text: '' });

    let backendSubmitted = false;

    try {
      await createAdminQuiz({
        assessment: category,
        quizName: normalizedQuizName
      });
      backendSubmitted = true;
    } catch {
      backendSubmitted = false;
    }

    try {
      const catalog = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || '{}');
      const existing = Array.isArray(catalog[category]) ? catalog[category] : [];

      const alreadyExists = existing.some(
        (item) => String(item || '').trim().toLowerCase() === normalizedQuizName.toLowerCase()
      );

      const updated = alreadyExists ? existing : [...existing, normalizedQuizName];
      catalog[category] = updated;
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(catalog));

      setMessage({
        type: 'success',
        text: backendSubmitted
          ? 'Quiz submitted successfully. It is now available in User Portal.'
          : 'Quiz submitted locally and published to User Portal list.'
      });
    } catch {
      setMessage({ type: 'error', text: 'Quiz submit failed while saving publish state.' });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="admin-manual-quiz-page">
      <nav className="admin-nav">
        <div className="admin-nav-content">
          <div className="admin-nav-left">
            <h1 className="admin-logo">Admin Portal</h1>
            <div className="admin-nav-links">
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/assessments">Assessments</Link>
              <Link to="/admin/careers">Careers</Link>
              <Link to="/admin/analytics">Analytics</Link>
              <Link to="/admin/manual-quiz" className="active">Manual Quiz</Link>
            </div>
          </div>
          <div className="admin-nav-right">
            <ThemeToggle />
            <button onClick={handleLogout} className="admin-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="admin-manual-quiz-main">
        <div className="admin-manual-quiz-container">
          <div className="admin-manual-quiz-header">
            <h2>Add Question (Manual)</h2>
            <Link to="/admin/assessments" className="back-link">← Back to Assessments</Link>
          </div>

          {message.text && (
            <div className={`message-banner ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="manual-quiz-layout">
            {/* Question Form */}
            <div className="question-form-section">
              <form onSubmit={handleSaveQuestion} className="question-form">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="quizName">Quiz Name</label>
                  <input
                    type="text"
                    id="quizName"
                    value={quizName}
                    onChange={(e) => setQuizName(e.target.value)}
                    placeholder="Enter quiz name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="question">Question</label>
                  <textarea
                    id="question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter your question here"
                    className="form-textarea"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="questionType">Question Category</label>
                  <select
                    id="questionType"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="form-select"
                  >
                    {questionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {questionType === 'mcq' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="option1">Option 1</label>
                      <input
                        type="text"
                        id="option1"
                        value={option1}
                        onChange={(e) => setOption1(e.target.value)}
                        placeholder="Enter option 1"
                        className="form-input"
                        required={questionType === 'mcq'}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="option2">Option 2</label>
                      <input
                        type="text"
                        id="option2"
                        value={option2}
                        onChange={(e) => setOption2(e.target.value)}
                        placeholder="Enter option 2"
                        className="form-input"
                        required={questionType === 'mcq'}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="option3">Option 3</label>
                      <input
                        type="text"
                        id="option3"
                        value={option3}
                        onChange={(e) => setOption3(e.target.value)}
                        placeholder="Enter option 3"
                        className="form-input"
                        required={questionType === 'mcq'}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="option4">Option 4</label>
                      <input
                        type="text"
                        id="option4"
                        value={option4}
                        onChange={(e) => setOption4(e.target.value)}
                        placeholder="Enter option 4"
                        className="form-input"
                        required={questionType === 'mcq'}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="correctAnswer">
                    {questionType === 'mcq' ? 'Correct Answer' : 'Expected Answer / Notes'}
                  </label>
                  <input
                    type="text"
                    id="correctAnswer"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder={
                      questionType === 'mcq'
                        ? 'Enter the correct answer (must match one option exactly)'
                        : 'Enter expected response or evaluation notes'
                    }
                    className="form-input"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="save-question-btn"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Question'}
                </button>
              </form>
            </div>

            {/* Question List */}
            <div className="question-list-section">
              <h3>Questions for: {quizName || '(No quiz selected)'}</h3>
              {questions.length === 0 ? (
                <p className="no-questions">No questions added yet. Create your first question!</p>
              ) : (
                <div className="question-list">
                  {questions.map((q, index) => (
                    <div key={q.id} className="question-item">
                      <div className="question-header">
                        <div className="question-header-left">
                          <span className="question-number">Q{index + 1}</span>
                          <span className="question-type-chip">{(q.questionType || 'mcq').toUpperCase()}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="delete-question-btn"
                          title="Delete question"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="question-text">{q.questionText}</p>
                      {(q.questionType || 'mcq') === 'mcq' ? (
                        <div className="question-options">
                          {(Array.isArray(q.options) ? q.options : []).map((opt, i) => (
                            <div 
                              key={i} 
                              className={`option ${opt === q.correctAnswer ? 'correct' : ''}`}
                            >
                              <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                              <span className="option-text">{opt}</span>
                              {opt === q.correctAnswer && <span className="correct-badge">✓ Correct</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="question-answer-note">
                          <strong>Expected:</strong> {q.correctAnswer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {questions.length > 0 && (
                <div className="question-list-footer">
                  <p className="question-count">Total Questions: {questions.length}</p>
                  <button
                    type="button"
                    className="submit-quiz-btn"
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                  >
                    {isSubmittingQuiz ? 'Submitting Quiz...' : 'Submit Quiz'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminManualQuiz;
