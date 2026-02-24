package com.example.full.project.service;

import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    // Generate 6 digit OTP
    public String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // Send OTP to email
    public void sendOtp(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("bhagatlokesh151@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Your OTP for Career Assessment Signup");
        message.setText("Your OTP is: " + otp + "\n\nDo not share this with anyone.");

        mailSender.send(message);
    }
}
