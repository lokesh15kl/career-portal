package com.example.full.project.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.full.project.entity.User;
import com.example.full.project.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            HttpSession session) {

        String normalizedEmail = email == null ? "" : email.trim();
        String normalizedPassword = password == null ? "" : password.trim();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Email not found");
        }

        if (!user.getPassword().equals(normalizedPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Wrong password");
        }

        session.setAttribute("loggedUser", user);

        return ResponseEntity.ok("Login success");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out");
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        User user = (User) session.getAttribute("loggedUser");

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Not authenticated");
        }

        Map<String, String> result = new HashMap<>();
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("role", user.getRole());

        return ResponseEntity.ok(result);
    }
}
