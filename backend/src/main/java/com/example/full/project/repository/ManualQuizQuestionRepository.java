package com.example.full.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.example.full.project.entity.ManualQuizQuestion;

public interface ManualQuizQuestionRepository extends JpaRepository<ManualQuizQuestion, Long> {
    List<ManualQuizQuestion> findByCategoryIgnoreCaseAndQuizTitleIgnoreCaseOrderByIdAsc(String category, String quizTitle);

    @Modifying
    @Transactional
    void deleteByCategoryIgnoreCase(String category);

    @Modifying
    @Transactional
    void deleteByCategoryIgnoreCaseAndQuizTitleIgnoreCase(String category, String quizTitle);
}
