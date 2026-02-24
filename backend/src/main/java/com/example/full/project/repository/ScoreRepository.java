package com.example.full.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.full.project.entity.Score;

public interface ScoreRepository extends JpaRepository<Score, Long> {
}

