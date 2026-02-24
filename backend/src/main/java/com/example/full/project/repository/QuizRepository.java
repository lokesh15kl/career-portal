package com.example.full.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.full.project.entity.Quiz;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // ===== OLD LOGIC (DO NOT REMOVE) =====
    List<Quiz> findByCategory(String category);

    // ===== NEW LOGIC: CATEGORY + QUIZ TITLE =====
    List<Quiz> findByCategoryAndQuizTitle(String category, String quizTitle);

    // ===== FETCH QUIZ LIST UNDER A CATEGORY =====
    @Query("SELECT DISTINCT q.quizTitle FROM Quiz q WHERE q.category = :category")
    List<String> findQuizTitlesByCategory(@Param("category") String category);
    @Query("SELECT DISTINCT q.category FROM Quiz q")
    List<String> findDistinctCategories();
    @Query("SELECT DISTINCT q.quizTitle FROM Quiz q WHERE q.category = :category")
    List<String> findAssessmentNamesByCategory(@Param("category") String category);

}
