package com.aifdphub.repository;

import com.aifdphub.model.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    @org.springframework.transaction.annotation.Transactional
    void deleteByFdpId(Long fdpId);
}
