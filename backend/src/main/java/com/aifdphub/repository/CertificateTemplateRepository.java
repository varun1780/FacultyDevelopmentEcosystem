package com.aifdphub.repository;

import com.aifdphub.model.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, Long> {
    Optional<CertificateTemplate> findByFdpId(Long fdpId);
}
