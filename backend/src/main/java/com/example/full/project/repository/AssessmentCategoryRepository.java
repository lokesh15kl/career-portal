package com.example.full.project.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.full.project.entity.AssessmentCategory;

public interface AssessmentCategoryRepository extends JpaRepository<AssessmentCategory, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<AssessmentCategory> findByNameIgnoreCase(String name);

    void deleteByNameIgnoreCase(String name);
}
