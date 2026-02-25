package com.example.full.project.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.full.project.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // 🔑 ADD THIS METHOD
    User findByEmail(String email);
    User findByEmailIgnoreCase(String email);

}
