package com.example.full.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.full.project.entity.AssessmentCategory;

public interface AssessmentCategoryRepository
        extends JpaRepository<AssessmentCategory, Long> {

    boolean existsByName(String name);

    AssessmentCategory findByName(String name);

    void deleteByName(String name);
}
