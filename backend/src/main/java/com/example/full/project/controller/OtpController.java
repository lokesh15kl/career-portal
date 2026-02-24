package com.example.full.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.example.full.project.service.OtpService;
import com.example.full.project.repository.UserRepository;
import com.example.full.project.entity.User;

import jakarta.servlet.http.HttpSession;

@Controller
public class OtpController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserRepository userRepo;   // 🔥 DATABASE ACCESS

    // ================= SEND OTP =================
    @PostMapping("/sendOtp")
    public String sendOtp(@RequestParam("email") String email,
                          @RequestParam("name") String name,
                          @RequestParam("password") String password,
                          HttpSession session,
                          Model model) {

        String otp = otpService.generateOtp();

        // 🔥 STORE USER DATA + OTP IN SESSION
        session.setAttribute("otp", otp);
        session.setAttribute("email", email);
        session.setAttribute("name", name);
        session.setAttribute("password", password);

        // DEBUG PRINT
        System.out.println("OTP for " + email + " is: " + otp);

        otpService.sendOtp(email, otp);

        model.addAttribute("email", email);
        return "otp";
    }

    // ================= VERIFY OTP =================
    @PostMapping("/verifyOtp")
    public String verifyOtp(@RequestParam("otp") String otp,
                            HttpSession session,
                            Model model) {

        // 🔥 GET DATA FROM SESSION
        String savedOtp = (String) session.getAttribute("otp");
        String email = (String) session.getAttribute("email");
        String name = (String) session.getAttribute("name");
        String password = (String) session.getAttribute("password");

        System.out.println("Entered OTP: " + otp);
        System.out.println("Saved OTP: " + savedOtp);
        System.out.println("Email from session: " + email);

        if (savedOtp != null && savedOtp.equals(otp)) {

            // 🔥 CREATE USER OBJECT
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(password);
            user.setRole("USER");   // only user by default

            // 🔥 SAVE USER INTO DATABASE
            userRepo.save(user);

            // CLEAR SESSION AFTER SUCCESS
            session.invalidate();

            // REDIRECT TO LOGIN PAGE
            return "login";

        } else {
            model.addAttribute("error", "Invalid OTP!");
            return "otp";
        }
    }
}
