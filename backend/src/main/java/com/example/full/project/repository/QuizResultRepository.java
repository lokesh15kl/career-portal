package com.example.full.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.full.project.entity.QuizResult;

public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findAllByOrderByAttemptedAtDesc();

    List<QuizResult> findByEmailIgnoreCaseOrderByAttemptedAtDesc(String email);
}
