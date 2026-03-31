package com.example.full.project.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "backend");
        return response;
    }

    @GetMapping("/db")
    public Map<String, Object> dbHealth() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", result != null && result == 1 ? "UP" : "DOWN");
        response.put("database", "connected");
        return response;
    }
}
