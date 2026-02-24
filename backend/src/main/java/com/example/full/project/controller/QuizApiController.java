package com.example.full.project.controller;

import com.example.full.project.entity.*;
import com.example.full.project.repository.*;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class QuizApiController {

    @Autowired
    private QuizRepository quizRepo;

    @Autowired
    private ScoreRepository scoreRepo;

    @Autowired
    private AssessmentCategoryRepository categoryRepo;

    @Autowired
    private QuestionResponseRepository questionResponseRepo;

    /* ================= CATEGORIES ================= */

    @GetMapping("/categories")
    public List<AssessmentCategory> getCategories(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        return (user == null) ? List.of() : categoryRepo.findAll();
    }

    @GetMapping("/admin/categories")
    public ResponseEntity<?> getAdminCategories(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can access categories");
        }

        return ResponseEntity.ok(categoryRepo.findAll());
    }

    @PostMapping(value = "/admin/categories", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addCategoryJson(@RequestBody Map<String, String> body,
                                             HttpSession session) {
        return addCategoryInternal(body != null ? body.get("name") : null,
                body != null ? body.get("note") : null,
                session);
    }

    @PostMapping(value = "/admin/categories", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> addCategoryForm(@RequestParam(value = "name", required = false) String name,
                                             @RequestParam(value = "note", required = false) String note,
                                             HttpSession session) {
        return addCategoryInternal(name, note, session);
    }

    @DeleteMapping("/admin/categories/{name}")
    public ResponseEntity<?> deleteCategoryPath(@PathVariable("name") String name,
                                                HttpSession session) {
        return deleteCategoryInternal(name, session);
    }

    @DeleteMapping("/admin/categories")
    public ResponseEntity<?> deleteCategoryBody(@RequestBody(required = false) Map<String, String> body,
                                                @RequestParam(value = "name", required = false) String name,
                                                HttpSession session) {
        String resolved = name;
        if ((resolved == null || resolved.isBlank()) && body != null) {
            resolved = body.get("name");
        }
        return deleteCategoryInternal(resolved, session);
    }

    @PutMapping(value = "/admin/categories", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> renameCategoryJson(@RequestBody Map<String, String> body,
                                                HttpSession session) {
        String oldName = body != null ? body.get("oldName") : null;
        if (oldName == null || oldName.isBlank()) {
            oldName = body != null ? body.get("name") : null;
        }
        String newName = body != null ? body.get("newName") : null;
        if (newName == null || newName.isBlank()) {
            newName = body != null ? body.get("nameNew") : null;
        }

        return renameCategoryInternal(oldName, newName, session);
    }

    @PutMapping(value = "/admin/categories", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> renameCategoryForm(@RequestParam(value = "oldName", required = false) String oldName,
                                                @RequestParam(value = "newName", required = false) String newName,
                                                @RequestParam(value = "name", required = false) String name,
                                                @RequestParam(value = "nameNew", required = false) String nameNew,
                                                HttpSession session) {
        String resolvedOld = (oldName != null && !oldName.isBlank()) ? oldName : name;
        String resolvedNew = (newName != null && !newName.isBlank()) ? newName : nameNew;
        return renameCategoryInternal(resolvedOld, resolvedNew, session);
    }

    /* ================= QUIZ LIST ================= */

    @GetMapping("/quizList")
    public List<String> quizList(@RequestParam("category") String category,
                                 HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        return (user == null) ? List.of()
                : quizRepo.findAssessmentNamesByCategory(category);
    }

    /* ================= ATTEMPT QUIZ ================= */

    @GetMapping("/attemptQuiz")
    public List<Quiz> attemptQuiz(@RequestParam("category") String category,
                                  @RequestParam("quizTitle") String quizTitle,
                                  HttpSession session) {

        User user = (User) session.getAttribute("loggedUser");
        if (user == null) return List.of();

        session.setAttribute("currentCategory", category);
        session.setAttribute("currentQuiz", quizTitle);

        return quizRepo.findByCategoryAndQuizTitle(category, quizTitle);
    }

    /* ================= SUBMIT QUIZ ================= */

    @PostMapping("/submitQuiz")
    @Transactional
    public int submitQuiz(@RequestParam Map<String, String> params,
                          HttpSession session) {

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

        return score;
    }

    /* ================= SUBMIT QUIZ WITH AUDIO & WRITTEN ================= */

    @PostMapping("/submitQuizWithAudio")
    @Transactional
    public int submitQuizWithAudio(@RequestParam Map<String, String> params,
                                    HttpSession session) throws Exception {

        User user = (User) session.getAttribute("loggedUser");
        if (user == null) return 0;

        String category = (String) session.getAttribute("currentCategory");
        String quizTitle = (String) session.getAttribute("currentQuiz");

        List<Quiz> quizList = quizRepo.findByCategoryAndQuizTitle(category, quizTitle);

        int score = 0;

        for (Quiz q : quizList) {
            String qType = q.getQuestionType() != null ? q.getQuestionType() : "mcq";
            String userAnswer = params.get("q" + q.getId());

            if ("mcq".equalsIgnoreCase(qType)) {
                // Score MCQ questions
                if (q.getCorrectAnswer().equals(userAnswer)) {
                    score++;
                }
            } else if ("written".equalsIgnoreCase(qType) || "audio".equalsIgnoreCase(qType)) {
                // Store written/audio responses
                if (userAnswer != null && !userAnswer.isEmpty()) {
                    QuestionResponse qr = new QuestionResponse();
                    qr.setUserEmail(user.getEmail());
                    qr.setCategory(category);
                    qr.setQuizTitle(quizTitle);
                    qr.setQuestionId(q.getId());
                    qr.setQuestionType(qType);
                    qr.setTextAnswer(userAnswer);
                    qr.setSubmittedAt(LocalDateTime.now());
                    questionResponseRepo.save(qr);
                    
                    // Count as answered (automatic point for written/audio)
                    score++;
                }
            }
        }

        // Save overall score
        Score s = new Score();
        s.setUserEmail(user.getEmail());
        s.setCategory(category);
        s.setQuizTitle(quizTitle);
        s.setScore(score);
        scoreRepo.save(s);

        return score;
    }

    /* ================= ADMIN: MANUAL QUESTIONS ================= */

    @PostMapping("/admin/saveQuestion")
    @Transactional
    public ResponseEntity<?> saveQuestionUrlEncoded(@RequestParam("category") String category,
                                                     @RequestParam("quizTitle") String quizTitle,
                                                     @RequestParam("question") String question,
                                                     @RequestParam("option1") String option1,
                                                     @RequestParam("option2") String option2,
                                                     @RequestParam("option3") String option3,
                                                     @RequestParam("option4") String option4,
                                                     @RequestParam("answer") String answer,
                                                     @RequestParam(value = "questionType", defaultValue = "mcq") String questionType,
                                                     HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can save questions");
        }

        String cleanCategory = clean(category);
        String cleanQuizTitle = clean(quizTitle);
        String cleanQuestion = clean(question);
        String cleanQuestionType = clean(questionType).toLowerCase();
        String cleanCorrectAnswer = clean(answer);

        if (cleanCategory.isEmpty() || cleanQuizTitle.isEmpty() || cleanQuestion.isEmpty() || cleanCorrectAnswer.isEmpty()) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        if (cleanQuestionType.isEmpty()) {
            cleanQuestionType = "mcq";
        }

        if (!categoryRepo.existsByName(cleanCategory)) {
            AssessmentCategory newCategory = new AssessmentCategory();
            newCategory.setName(cleanCategory);
            categoryRepo.save(newCategory);
        }

        String cleanOption1 = clean(option1);
        String cleanOption2 = clean(option2);
        String cleanOption3 = clean(option3);
        String cleanOption4 = clean(option4);

        if ("mcq".equalsIgnoreCase(cleanQuestionType)) {
            if (cleanOption1.isEmpty() || cleanOption2.isEmpty() || cleanOption3.isEmpty() || cleanOption4.isEmpty()) {
                return ResponseEntity.badRequest().body("MCQ requires 4 options");
            }
        } else {
            cleanOption1 = cleanOption1.isEmpty() ? "N/A" : cleanOption1;
            cleanOption2 = cleanOption2.isEmpty() ? "N/A" : cleanOption2;
            cleanOption3 = cleanOption3.isEmpty() ? "N/A" : cleanOption3;
            cleanOption4 = cleanOption4.isEmpty() ? "N/A" : cleanOption4;
        }

        Quiz quiz = new Quiz();
        quiz.setCategory(cleanCategory);
        quiz.setQuizTitle(cleanQuizTitle);
        quiz.setQuestion(cleanQuestion);
        quiz.setOption1(cleanOption1);
        quiz.setOption2(cleanOption2);
        quiz.setOption3(cleanOption3);
        quiz.setOption4(cleanOption4);
        quiz.setCorrectAnswer(cleanCorrectAnswer);
        quiz.setQuestionType(cleanQuestionType);
        quizRepo.save(quiz);

        return ResponseEntity.ok(Map.of("message", "Question saved successfully", "questionType", cleanQuestionType));
    }

    @PostMapping("/admin/questions")
    @Transactional
    public ResponseEntity<?> saveManualQuestion(@RequestBody ManualQuestionRequest request,
                                                HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can save questions");
        }

        String category = clean(request.getCategory());
        String quizTitle = clean(request.getQuizName());
        String question = clean(request.getQuestionText());
        String questionType = clean(request.getQuestionType());
        String correctAnswer = clean(request.getCorrectAnswer());

        if (category.isEmpty() || quizTitle.isEmpty() || question.isEmpty() || correctAnswer.isEmpty()) {
            return ResponseEntity.badRequest().body("Missing required fields");
        }

        if (questionType.isEmpty()) {
            questionType = "mcq";
        }

        if (!categoryRepo.existsByName(category)) {
            AssessmentCategory newCategory = new AssessmentCategory();
            newCategory.setName(category);
            categoryRepo.save(newCategory);
        }

        List<String> options = request.getOptions();
        String option1 = optionAt(options, 0);
        String option2 = optionAt(options, 1);
        String option3 = optionAt(options, 2);
        String option4 = optionAt(options, 3);

        if ("mcq".equalsIgnoreCase(questionType)) {
            if (option1.isEmpty() || option2.isEmpty() || option3.isEmpty() || option4.isEmpty()) {
                return ResponseEntity.badRequest().body("MCQ requires 4 options");
            }
        } else {
            option1 = option1.isEmpty() ? "N/A" : option1;
            option2 = option2.isEmpty() ? "N/A" : option2;
            option3 = option3.isEmpty() ? "N/A" : option3;
            option4 = option4.isEmpty() ? "N/A" : option4;
        }

        Quiz quiz = new Quiz();
        quiz.setCategory(category);
        quiz.setQuizTitle(quizTitle);
        quiz.setQuestion(question);
        quiz.setOption1(option1);
        quiz.setOption2(option2);
        quiz.setOption3(option3);
        quiz.setOption4(option4);
        quiz.setCorrectAnswer(correctAnswer);
        quiz.setQuestionType(questionType.toLowerCase());
        quizRepo.save(quiz);

        return ResponseEntity.ok("Question saved");
    }

    @GetMapping("/admin/questions")
    public List<Quiz> getManualQuestions(@RequestParam("category") String category,
                                         @RequestParam("quizName") String quizName,
                                         HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return List.of();
        }

        return quizRepo.findByCategoryAndQuizTitle(category, quizName);
    }

    /* ================= ADMIN: QUIZ PUBLISH ================= */

    @PostMapping("/admin/quizzes")
    @Transactional
    public ResponseEntity<?> publishQuiz(@RequestBody Map<String, String> body,
                                         HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can publish quizzes");
        }

        String category = clean(body.get("category"));
        if (category.isEmpty()) {
            category = clean(body.get("assessment"));
        }

        String quizTitle = clean(body.get("quizTitle"));
        if (quizTitle.isEmpty()) {
            quizTitle = clean(body.get("quizName"));
        }

        if (category.isEmpty() || quizTitle.isEmpty()) {
            return ResponseEntity.badRequest().body("Missing category or quiz title");
        }

        if (!categoryRepo.existsByName(category)) {
            AssessmentCategory newCategory = new AssessmentCategory();
            newCategory.setName(category);
            categoryRepo.save(newCategory);
        }

        return ResponseEntity.ok("Quiz published");
    }

    @GetMapping("/admin/scores")
    public ResponseEntity<?> getAdminScores(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can access scores");
        }

        return ResponseEntity.ok(scoreRepo.findAll());
    }

        @GetMapping("/admin/analytics")
        public ResponseEntity<?> getAdminAnalytics(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");

        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Only admin can access analytics");
        }

        List<Score> scores = scoreRepo.findAll();

        long totalAttempts = scores.size();
        double averageScore = scores.stream()
            .mapToInt(Score::getScore)
            .average()
            .orElse(0.0);

        Map<String, Long> attemptsByCategory = scores.stream()
            .collect(Collectors.groupingBy(
                Score::getCategory,
                Collectors.counting()
            ));

        Map<String, Double> averageByCategory = scores.stream()
            .collect(Collectors.groupingBy(
                Score::getCategory,
                Collectors.averagingInt(Score::getScore)
            ));

        Map<String, Long> attemptsByUser = scores.stream()
            .collect(Collectors.groupingBy(
                score -> score.getUserEmail() == null ? "UNKNOWN" : score.getUserEmail(),
                Collectors.counting()
            ));

        Map<String, Long> sortedAttemptsByCategory = attemptsByCategory.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (left, right) -> left,
                LinkedHashMap::new
            ));

        Map<String, Double> sortedAverageByCategory = averageByCategory.entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue(Comparator.reverseOrder()))
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (left, right) -> left,
                LinkedHashMap::new
            ));

        Map<String, Long> sortedAttemptsByUser = attemptsByUser.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
            .limit(8)
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (left, right) -> left,
                LinkedHashMap::new
            ));

        return ResponseEntity.ok(Map.of(
            "totalAttempts", totalAttempts,
            "averageScore", averageScore,
            "attemptsByCategory", sortedAttemptsByCategory,
            "averageByCategory", sortedAverageByCategory,
            "topUsersByAttempts", sortedAttemptsByUser
        ));
    }

    /* ================= ALL QUIZZES (OPTIONAL) ================= */

    @GetMapping("/quizzes")
    public List<Quiz> getAllQuizzes() {
        return quizRepo.findAll();
    }

    public static class ManualQuestionRequest {
        private String category;
        private String quizName;
        private String questionText;
        private String questionType;
        private List<String> options;
        private String correctAnswer;

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getQuizName() {
            return quizName;
        }

        public void setQuizName(String quizName) {
            this.quizName = quizName;
        }

        public String getQuestionText() {
            return questionText;
        }

        public void setQuestionText(String questionText) {
            this.questionText = questionText;
        }

        public String getQuestionType() {
            return questionType;
        }

        public void setQuestionType(String questionType) {
            this.questionType = questionType;
        }

        public List<String> getOptions() {
            return options;
        }

        public void setOptions(List<String> options) {
            this.options = options;
        }

        public String getCorrectAnswer() {
            return correctAnswer;
        }

        public void setCorrectAnswer(String correctAnswer) {
            this.correctAnswer = correctAnswer;
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private ResponseEntity<?> addCategoryInternal(String rawName,
                                                  String rawNote,
                                                  HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can add categories");
        }

        String name = clean(rawName);
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body("Category name is required");
        }

        if (categoryRepo.existsByName(name)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Category already exists");
        }

        AssessmentCategory category = new AssessmentCategory();
        category.setName(name);
        categoryRepo.save(category);

        return ResponseEntity.ok(Map.of(
                "message", "Category added",
                "name", name,
                "note", clean(rawNote)
        ));
    }

    private ResponseEntity<?> deleteCategoryInternal(String rawName,
                                                     HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can delete categories");
        }

        String name = clean(rawName);
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body("Category name is required");
        }

        if (!categoryRepo.existsByName(name)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Category not found");
        }

        categoryRepo.deleteByName(name);
        return ResponseEntity.ok(Map.of("message", "Category deleted", "name", name));
    }

    private ResponseEntity<?> renameCategoryInternal(String rawOldName,
                                                     String rawNewName,
                                                     HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can update categories");
        }

        String oldName = clean(rawOldName);
        String newName = clean(rawNewName);

        if (oldName.isEmpty() || newName.isEmpty()) {
            return ResponseEntity.badRequest().body("Both current and new category names are required");
        }

        if (oldName.equalsIgnoreCase(newName)) {
            return ResponseEntity.ok(Map.of("message", "Category unchanged", "name", oldName));
        }

        AssessmentCategory existing = categoryRepo.findByName(oldName);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Category not found");
        }

        if (categoryRepo.existsByName(newName)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Category already exists");
        }

        existing.setName(newName);
        categoryRepo.save(existing);

        return ResponseEntity.ok(Map.of(
                "message", "Category renamed",
                "oldName", oldName,
                "newName", newName
        ));
    }

    private String optionAt(List<String> options, int index) {
        if (options == null || options.size() <= index) {
            return "";
        }
        return clean(options.get(index));
    }
}

