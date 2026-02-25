package com.example.full.project.controller;

import java.io.IOException;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.example.full.project.entity.User;
import com.example.full.project.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public class PageController {

    private static final long CAPTCHA_TTL_MILLIS = 5 * 60 * 1000;
    private final Map<String, CaptchaChallenge> captchaChallenges = new ConcurrentHashMap<>();

    private static class CaptchaChallenge {
        private final String captcha;
        private final long expiresAt;

        private CaptchaChallenge(String captcha, long expiresAt) {
            this.captcha = captcha;
            this.expiresAt = expiresAt;
        }
    }

    @Autowired
    private UserRepository userRepo;

    /* ================= CAPTCHA UTILITY ================= */

    private String generateCaptcha() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        StringBuilder captcha = new StringBuilder();
        Random random = new Random();

        for (int i = 0; i < 5; i++) {
            captcha.append(chars.charAt(random.nextInt(chars.length())));
        }
        return captcha.toString();
    }

    private void purgeExpiredCaptchaChallenges() {
        long now = System.currentTimeMillis();
        captchaChallenges.entrySet().removeIf(entry -> entry.getValue().expiresAt < now);
    }

    /* ================= PAGES ================= */

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/signup")
    public String signup() {
        return "signup";
    }

    @GetMapping("/login")
    public String login(HttpSession session, Model model) {

        String captcha = generateCaptcha();
        session.setAttribute("captcha", captcha);
        model.addAttribute("captchaText", captcha);

        return "login";
    }

    /* ================= LOGIN WITH CAPTCHA ================= */

    @PostMapping("/doLogin")
    public String doLogin(@RequestParam("email") String email,
                          @RequestParam("password") String password,
                          @RequestParam("captcha") String captcha,
                          @RequestParam(value = "captchaId", required = false) String captchaId,
                          HttpSession session,
                          Model model) {

        String normalizedEmail = email == null ? "" : email.trim();
        String normalizedPassword = password == null ? "" : password.trim();
        String normalizedCaptcha = captcha == null ? "" : captcha.trim();

        purgeExpiredCaptchaChallenges();
        boolean captchaValid = false;

        if (captchaId != null && !captchaId.isBlank()) {
            CaptchaChallenge challenge = captchaChallenges.remove(captchaId);
            if (challenge != null && challenge.expiresAt >= System.currentTimeMillis()) {
                captchaValid = challenge.captcha.equalsIgnoreCase(normalizedCaptcha);
            }
        }

        if (!captchaValid) {
            String sessionCaptcha = (String) session.getAttribute("captcha");
            captchaValid = sessionCaptcha != null && sessionCaptcha.equalsIgnoreCase(normalizedCaptcha);
        }

        if (!captchaValid) {
            model.addAttribute("captchaError", "Invalid captcha");
            model.addAttribute("captchaText", generateCaptcha());
            session.setAttribute("captcha", model.getAttribute("captchaText"));
            return "login";
        }

        User user = userRepo.findByEmailIgnoreCase(normalizedEmail);

        if (user == null) {
            model.addAttribute("error", "Email not found");

            String newCaptcha = generateCaptcha();
            session.setAttribute("captcha", newCaptcha);
            model.addAttribute("captchaText", newCaptcha);

            return "login";
        }

        if (!user.getPassword().equals(normalizedPassword)) {
            model.addAttribute("error", "Wrong password");

            String newCaptcha = generateCaptcha();
            session.setAttribute("captcha", newCaptcha);
            model.addAttribute("captchaText", newCaptcha);

            return "login";
        }

        session.setAttribute("loggedUser", user);

        return "ADMIN".equals(user.getRole())
                ? "admin-dashboard"
                : "select-category";
    }

    /* ================= ADMIN ================= */

    @GetMapping("/adminDashboard")
    public String adminDashboard(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        return (user != null && "ADMIN".equals(user.getRole()))
                ? "admin-dashboard"
                : "login";
    }

    @GetMapping("/addQuiz")
    public String addQuiz(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");
        return (user != null && "ADMIN".equals(user.getRole()))
                ? "add-quiz"
                : "login";
    }
    @GetMapping("/api/captcha")
    @ResponseBody
    public Map<String, String> getCaptcha(HttpSession session) {
        purgeExpiredCaptchaChallenges();
        String captcha = generateCaptcha();
        String captchaId = UUID.randomUUID().toString();

        session.setAttribute("captcha", captcha);
        captchaChallenges.put(captchaId, new CaptchaChallenge(captcha, System.currentTimeMillis() + CAPTCHA_TTL_MILLIS));

        return Map.of("captcha", captcha, "captchaId", captchaId);
    }


    /* ================= LOGOUT ================= */

    @GetMapping("/logout")
    public void logout(HttpSession session, HttpServletResponse response) throws IOException {
        session.invalidate();
        response.sendRedirect("http://localhost:8080/login");
    }

}
