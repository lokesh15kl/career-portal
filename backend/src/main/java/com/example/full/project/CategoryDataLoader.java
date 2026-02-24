package com.example.full.project;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.full.project.entity.AssessmentCategory;
import com.example.full.project.repository.AssessmentCategoryRepository;

@Component
public class CategoryDataLoader {

    @Autowired
    private AssessmentCategoryRepository categoryRepo;

    @PostConstruct
    public void loadDefaultCategories() {

        if (categoryRepo.count() == 0) {

            AssessmentCategory c1 = new AssessmentCategory();
            c1.setName("Aptitude");

            AssessmentCategory c2 = new AssessmentCategory();
            c2.setName("Technical");

            AssessmentCategory c3 = new AssessmentCategory();
            c3.setName("Personality");

            categoryRepo.save(c1);
            categoryRepo.save(c2);
            categoryRepo.save(c3);

            System.out.println("Default categories inserted");
        }
    }
}
