package com.example.full.project.controller;

import com.example.full.project.entity.Quiz;
import com.example.full.project.entity.Score;
import com.example.full.project.entity.User;
import com.example.full.project.repository.AssessmentCategoryRepository;
import com.example.full.project.repository.QuizRepository;
import com.example.full.project.repository.ScoreRepository;
import com.example.full.project.service.HuggingFaceService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class QuizController {

    @Autowired
    private QuizRepository quizRepo;

    @Autowired
    private ScoreRepository scoreRepo;

    @Autowired
    private HuggingFaceService huggingFaceService;

    @Autowired
    private AssessmentCategoryRepository categoryRepo;

    /* =========================================================
                       ADMIN : MANUAL QUIZ
       ========================================================= */

    @GetMapping("/admin/manualQuiz")
    public String manualQuiz(@RequestParam("category") String category,
                             HttpSession session,
                             Model model) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        model.addAttribute("category", category);
        return "manual-quiz";
    }

    @PostMapping("/admin/saveManualQuiz")
    @Transactional
    public String saveManualQuiz(@RequestParam("category") String category,
                                 @RequestParam("quizTitle") String quizTitle,
                                 @RequestParam("question") String question,
                                 @RequestParam("option1") String option1,
                                 @RequestParam("option2") String option2,
                                 @RequestParam("option3") String option3,
                                 @RequestParam("option4") String option4,
                                 @RequestParam("answer") String answer,
                                 @RequestParam(value = "questionType", defaultValue = "mcq") String questionType,
                                 HttpSession session) {

        System.out.println("=== SAVING MANUAL QUIZ ===");
        System.out.println("Category: " + category);
        System.out.println("QuizTitle: " + quizTitle);
        System.out.println("Question: " + question);
        System.out.println("QuestionType [CRITICAL]: " + questionType);
        System.out.println("Option1: " + option1);
        System.out.println("Option2: " + option2);
        System.out.println("Option3: " + option3);
        System.out.println("Option4: " + option4);
        System.out.println("Answer: " + answer);
        System.out.println("=======================");

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        Quiz quiz = new Quiz();
        quiz.setCategory(category.trim());
        quiz.setQuizTitle(quizTitle.trim());
        quiz.setQuestion(question);
        quiz.setOption1(option1);
        quiz.setOption2(option2);
        quiz.setOption3(option3);
        quiz.setOption4(option4);
        quiz.setCorrectAnswer(answer);
        quiz.setQuestionType(questionType);

        System.out.println("Before Save - Quiz.questionType: " + quiz.getQuestionType());

        Quiz savedQuiz = quizRepo.save(quiz);
        
        System.out.println("After Save - Quiz ID: " + savedQuiz.getId() + ", QuestionType: " + savedQuiz.getQuestionType());

        return "redirect:/admin/manualQuiz?category=" + category;
    }

    /* =========================================================
                       ADMIN : AI QUIZ
       ========================================================= */

    @GetMapping("/generate-quiz")
    public String generateQuizPage(HttpSession session, Model model) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        model.addAttribute("categories", categoryRepo.findAll());
        return "generate-quiz";
    }

    @PostMapping("/admin/generateQuizAI")
    public String generateQuizAI(@RequestParam("category") String category,
                                 @RequestParam("quizTitle") String quizTitle,
                                 @RequestParam("difficulty") String difficulty,
                                 @RequestParam("count") int count,
                                 HttpSession session,
                                 Model model) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        if (count > 10) count = 10;

        String prompt = """
            Generate %d MCQs for quiz "%s".
            Difficulty: %s.
            Return ONLY JSON array with:
            question, option1, option2, option3, option4, answer
            """.formatted(count, quizTitle, difficulty);

        try {
            String aiResponse = huggingFaceService.generateQuiz(prompt);
            model.addAttribute("aiResponse", aiResponse);
            model.addAttribute("category", category);
            model.addAttribute("quizTitle", quizTitle);
            return "ai-preview";
        } catch (Exception e) {
            model.addAttribute("category", category);
            model.addAttribute("quizTitle", quizTitle);
            model.addAttribute("aiResponse", generateFallbackQuiz(quizTitle, category, count));
            model.addAttribute("msg", "AI service is currently unavailable. Generated fallback quiz.");
            return "ai-preview";
        }
    }

    @PostMapping("/admin/saveAIQuiz")
    @Transactional
    public String saveAIQuiz(@RequestParam("category") String category,
                             @RequestParam("quizTitle") String quizTitle,
                             @RequestParam("aiResponse") String aiResponse) throws Exception {

        saveQuestions(category, quizTitle, aiResponse);
        return "redirect:/adminDashboard";
    }

    /* =========================================================
                       USER : CATEGORY SELECTION
       ========================================================= */

    @GetMapping("/select-category")
    public String selectCategory(HttpSession session, Model model) {

        User user = (User) session.getAttribute("loggedUser");
        if (user == null) return "login";

        model.addAttribute("categories", categoryRepo.findAll());
        return "select-category";
    }

    /* =========================================================
                       USER : QUIZ LIST (ASSESSMENTS)
       ========================================================= */

    @GetMapping("/quizList")
    public String quizList(@RequestParam("category") String category, Model model) {

        List<String> quizNames =
                quizRepo.findAssessmentNamesByCategory(category);

        if (quizNames.isEmpty()) {
            model.addAttribute("error",
                    "No assessments available for this category");
        }

        model.addAttribute("category", category);
        model.addAttribute("quizNames", quizNames);
        return "quiz-list";
    }

    /* =========================================================
                       USER : ATTEMPT QUIZ
       ========================================================= */

    @GetMapping("/attemptQuiz")
    public String attemptQuiz(@RequestParam("category") String category,
                              @RequestParam("quizTitle") String quizTitle,
                              HttpSession session,
                              Model model) {

        List<Quiz> quizList =
                quizRepo.findByCategoryAndQuizTitle(category, quizTitle);

        session.setAttribute("currentCategory", category);
        session.setAttribute("currentQuiz", quizTitle);

        model.addAttribute("quizList", quizList);
        model.addAttribute("quizName", quizTitle);
        return "assessment";
    }

    /* =========================================================
                       USER : SUBMIT QUIZ
       ========================================================= */

    @PostMapping("/submitQuiz")
    @Transactional
    public String submitQuiz(@RequestParam Map<String, String> params,
                             HttpSession session,
                             Model model) {

        User user = (User) session.getAttribute("loggedUser");

        String category =
                (String) session.getAttribute("currentCategory");
        String quizTitle =
                (String) session.getAttribute("currentQuiz");

        List<Quiz> quizList =
                quizRepo.findByCategoryAndQuizTitle(category, quizTitle);

        int score = 0;
        for (Quiz q : quizList) {
            if (q.getCorrectAnswer()
                    .equals(params.get("q" + q.getId()))) {
                score++;
            }
        }

        Score s = new Score();
        s.setUserEmail(user != null ? user.getEmail() : "UNKNOWN");
        s.setCategory(category);
        s.setQuizTitle(quizTitle);
        s.setScore(score);
        scoreRepo.save(s);

        model.addAttribute("score", score);
        model.addAttribute("quizName", quizTitle);
        return "result";
    }

    /* =========================================================
                       USER : AI PRACTICE
       ========================================================= */

    @GetMapping("/user/generateAIQuiz")
    public String userAIQuizPage(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        return (user != null) ? "ai-user-quiz" : "login";
    }
    @GetMapping("/admin/assessments")
    public String adminAssessments(HttpSession session) {

        User admin = (User) session.getAttribute("loggedUser");

        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        return "admin-assessments";
    }


    @PostMapping("/user/generateAIQuiz")
    public String userGenerateAIQuiz(@RequestParam(value = "quizTitle", required = false) String quizTitle,
                                     @RequestParam("topic") String topic,
                                     HttpSession session,
                                     Model model) {

        User user = (User) session.getAttribute("loggedUser");
        if (user == null) return "login";

        String resolvedQuizTitle = (quizTitle == null || quizTitle.isBlank())
                ? "AI Practice Quiz"
                : quizTitle.trim();

        String prompt = """
            Generate 5 MCQs for quiz "%s" on topic "%s".
            Return ONLY JSON array with:
            question, option1, option2, option3, option4, answer
            """.formatted(resolvedQuizTitle, topic);

        try {
            String aiResponse = huggingFaceService.generateQuiz(prompt);
            model.addAttribute("quizTitle", resolvedQuizTitle);
            model.addAttribute("aiResponse", aiResponse);
            return "ai-user-quiz";
        } catch (Exception e) {
            model.addAttribute("quizTitle", resolvedQuizTitle);
            model.addAttribute("aiResponse", generateFallbackQuiz(resolvedQuizTitle, topic, 5));
            model.addAttribute("msg", "AI service is unavailable now. Generated fallback practice quiz.");
            return "ai-user-quiz";
        }
    }

    @PostMapping("/user/saveAIQuiz")
    @Transactional
    public String userSaveAIQuiz(@RequestParam("category") String category,
                                 @RequestParam("quizTitle") String quizTitle,
                                 @RequestParam("aiResponse") String aiResponse,
                                 HttpSession session,
                                 Model model) {

        User user = (User) session.getAttribute("loggedUser");
        if (user == null) return "login";

        try {
            saveQuestions(category, quizTitle, aiResponse);
            model.addAttribute("msg", "Quiz saved successfully. You can now attempt it from assessments.");
        } catch (Exception e) {
            model.addAttribute("error", "Failed to save generated quiz");
        }

        return "ai-user-quiz";
    }

    /* =========================================================
                       ADMIN : VIEW SCORES
       ========================================================= */

    @GetMapping("/viewScores")
    public String viewScores(HttpSession session, Model model) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        model.addAttribute("scores", scoreRepo.findAll());
        return "view-scores";
    }

    /* =========================================================
                       COMMON : SAVE QUESTIONS
       ========================================================= */

    private void saveQuestions(String category,
                               String quizTitle,
                               String aiResponse) throws Exception {

        int start = aiResponse.indexOf("[");
        int end = aiResponse.lastIndexOf("]");
        aiResponse = aiResponse.substring(start, end + 1);

        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, String>> questions =
                mapper.readValue(aiResponse,
                        new TypeReference<>() {});

        for (Map<String, String> q : questions) {
            Quiz quiz = new Quiz();
            quiz.setCategory(category.trim());
            quiz.setQuizTitle(quizTitle.trim());
            quiz.setQuestion(q.get("question"));
            quiz.setOption1(q.get("option1"));
            quiz.setOption2(q.get("option2"));
            quiz.setOption3(q.get("option3"));
            quiz.setOption4(q.get("option4"));
            String correctAnswer = q.get("answer") != null ? q.get("answer") : q.get("correctAnswer");
            quiz.setCorrectAnswer(correctAnswer != null ? correctAnswer : "Concept A");
            quiz.setQuestionType("mcq"); // AI-generated quizzes are MCQ
            quizRepo.save(quiz);
        }
    }

    private String generateFallbackQuiz(String quizTitle, String topic, int count) {
        int safeCount = Math.max(1, Math.min(count, 10));

        try {
            List<Map<String, String>> questions = java.util.stream.IntStream.rangeClosed(1, safeCount)
                    .mapToObj(index -> Map.of(
                            "question", topic + " - Question " + index,
                            "option1", "Concept A",
                            "option2", "Concept B",
                            "option3", "Concept C",
                            "option4", "Concept D",
                            "answer", "Concept A"
                    ))
                    .toList();

            return new ObjectMapper().writeValueAsString(questions);
        } catch (Exception ignored) {
            return "[]";
        }
    }
    
}
