package com.aifdphub.repository;

import com.aifdphub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(String role);
    long countByRole(String role);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.college.id = :collegeId")
    List<User> findByCollegeId(@org.springframework.data.repository.query.Param("collegeId") Long collegeId);
}
