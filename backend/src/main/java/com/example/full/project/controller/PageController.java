package com.example.full.project.controller;

import com.example.full.project.entity.User;
import com.example.full.project.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Random;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class PageController {

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
                          HttpSession session,
                          Model model) {

        String sessionCaptcha = (String) session.getAttribute("captcha");

        if (sessionCaptcha == null || !sessionCaptcha.equalsIgnoreCase(captcha)) {
            model.addAttribute("captchaError", "Invalid captcha");
            model.addAttribute("captchaText", generateCaptcha());
            session.setAttribute("captcha", model.getAttribute("captchaText"));
            return "login";
        }

        User user = userRepo.findByEmail(email);

        if (user == null || !user.getPassword().equals(password)) {
            model.addAttribute("error", "Invalid credentials");

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
    public String getCaptcha(HttpSession session) {
        String captcha = generateCaptcha();
        session.setAttribute("captcha", captcha);
        return captcha;
    }


    /* ================= LOGOUT ================= */

    @GetMapping("/logout")
    public void logout(HttpSession session, HttpServletResponse response) throws IOException {
        session.invalidate();
        response.sendRedirect("http://localhost:8080/login");
    }

}
