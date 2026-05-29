package com.aifdphub.repository;

import com.aifdphub.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUserId(Long userId);
    List<Enrollment> findByFdpProgramId(Long fdpId);
    Optional<Enrollment> findByUserIdAndFdpProgramId(Long userId, Long fdpId);
    long countByIsCompleted(Boolean isCompleted);
    long countByFdpProgramId(Long fdpId);
    @org.springframework.transaction.annotation.Transactional
    void deleteByFdpProgramId(Long fdpId);
}
