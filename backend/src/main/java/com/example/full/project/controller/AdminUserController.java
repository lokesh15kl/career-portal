package com.example.full.project.controller;

import com.example.full.project.entity.User;
import com.example.full.project.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AdminUserController {

    @Autowired
    private UserRepository userRepo;

    /* ================= OPEN MAKE ADMIN PAGE ================= */
    @GetMapping("/makeAdmin")
    public String makeAdminPage(HttpSession session) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        return "make-admin"; // make-admin.html
    }

    /* ================= MAKE USER ADMIN ================= */
    @PostMapping("/makeAdmin")
    public String makeAdmin(@RequestParam("email") String email,
                            HttpSession session,
                            Model model) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        User user = userRepo.findByEmail(email);
        if (user == null) {
            model.addAttribute("error", "User not found");
            return "make-admin";
        }

        user.setRole("ADMIN");
        userRepo.save(user);

        model.addAttribute("success", "User promoted to ADMIN successfully");
        return "make-admin";
    }

    /* ================= API: MAKE USER ADMIN ================= */
    @PostMapping("/api/admin/users/promote")
    @ResponseBody
    public ResponseEntity<?> promoteUserApi(@RequestBody(required = false) java.util.Map<String, String> body,
                                            @RequestParam(value = "email", required = false) String email,
                                            HttpSession session) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only admin can promote users");
        }

        String resolved = email;
        if ((resolved == null || resolved.isBlank()) && body != null) {
            resolved = body.get("email");
        }

        if (resolved == null || resolved.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }

        User user = userRepo.findByEmail(resolved.trim());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        user.setRole("ADMIN");
        userRepo.save(user);

        return ResponseEntity.ok(java.util.Map.of(
                "message", "User promoted to ADMIN successfully",
                "email", user.getEmail()
        ));
    }

    @PostMapping("/api/admin/make-admin")
    @ResponseBody
    public ResponseEntity<?> promoteUserApiAlias(@RequestBody(required = false) java.util.Map<String, String> body,
                                                 @RequestParam(value = "email", required = false) String email,
                                                 HttpSession session) {
        return promoteUserApi(body, email, session);
    }
}
