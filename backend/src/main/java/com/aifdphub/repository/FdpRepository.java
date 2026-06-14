package com.aifdphub.repository;

import com.aifdphub.model.FdpProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FdpRepository extends JpaRepository<FdpProgram, Long> {
    List<FdpProgram> findByStatus(String status);
    List<FdpProgram> findByCategory(String category);
    long countByStatus(String status);
    List<FdpProgram> findAllByOrderByCreatedAtDesc();
    List<FdpProgram> findByCollegeId(Long collegeId);
    List<FdpProgram> findByCollegeIdAndStatus(Long collegeId, String status);
    long countByCollegeId(Long collegeId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT f.category FROM FdpProgram f WHERE f.category IS NOT NULL AND f.category != ''")
    List<String> findDistinctCategories();
}
