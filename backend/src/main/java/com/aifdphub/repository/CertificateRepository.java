package com.aifdphub.repository;

import com.aifdphub.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByCertificateId(String certificateId);
    Optional<Certificate> findByCertificateHash(String certificateHash);
    List<Certificate> findByUserId(Long userId);
    List<Certificate> findByFdpProgramId(Long fdpId);
    boolean existsByUserIdAndFdpProgramId(Long userId, Long fdpId);
    List<Certificate> findByCollegeId(Long collegeId);
    
    List<Certificate> findByFdpProgramCollegeId(Long collegeId);
    long countByFdpProgramCollegeId(Long collegeId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByFdpProgramId(Long fdpId);
}
