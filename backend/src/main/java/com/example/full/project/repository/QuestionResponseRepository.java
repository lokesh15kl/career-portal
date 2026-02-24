package com.example.full.project.repository;

import com.example.full.project.entity.QuestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionResponseRepository extends JpaRepository<QuestionResponse, Long> {
    List<QuestionResponse> findByUserEmailAndCategoryAndQuizTitle(String userEmail, String category, String quizTitle);
    List<QuestionResponse> findByUserEmailAndQuestionIdAndQuestionType(String userEmail, Long questionId, String questionType);
}
