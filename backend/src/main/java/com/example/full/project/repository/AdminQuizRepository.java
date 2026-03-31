package com.example.full.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.full.project.entity.AdminQuiz;

public interface AdminQuizRepository extends JpaRepository<AdminQuiz, Long> {
    boolean existsByCategoryIgnoreCaseAndQuizTitleIgnoreCase(String category, String quizTitle);

    List<AdminQuiz> findByCategoryIgnoreCaseOrderByQuizTitleAsc(String category);

    void deleteByCategoryIgnoreCase(String category);
}
