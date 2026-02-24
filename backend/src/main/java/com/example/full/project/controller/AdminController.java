package com.example.full.project.controller;

import com.example.full.project.entity.AssessmentCategory;
import com.example.full.project.entity.User;
import com.example.full.project.repository.AssessmentCategoryRepository;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AdminController {

    @Autowired
    private AssessmentCategoryRepository categoryRepo;

    /* ===== VIEW CAREERS PAGE ===== */
    @GetMapping("/admin/careers")
    public String careers(HttpSession session, Model model) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        model.addAttribute("categories", categoryRepo.findAll());
        return "admin-careers";
    }

    /* ===== ADD NEW CATEGORY ===== */
    @PostMapping("/admin/addCategory")
    public String addCategory(@RequestParam("name") String name,
                              HttpSession session,
                              RedirectAttributes redirect) {

        User admin = (User) session.getAttribute("loggedUser");
        if (admin == null || !"ADMIN".equals(admin.getRole())) {
            return "login";
        }

        if (categoryRepo.existsByName(name.trim())) {
            redirect.addFlashAttribute("error", "Category already exists");
        } else {
            AssessmentCategory c = new AssessmentCategory();
            c.setName(name.trim());
            categoryRepo.save(c);
            redirect.addFlashAttribute("msg", "Category added successfully");
        }

        return "redirect:/admin/careers";
    }
}
