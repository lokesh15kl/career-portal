package com.example.full.project.repository;

import com.example.full.project.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    // 🔑 ADD THIS METHOD
    User findByEmail(String email);

}
