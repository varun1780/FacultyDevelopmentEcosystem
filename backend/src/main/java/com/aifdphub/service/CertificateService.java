package com.aifdphub.service;

import com.aifdphub.model.Certificate;
import com.aifdphub.model.CertificateTemplate;
import com.aifdphub.model.Enrollment;
import com.aifdphub.model.FdpProgram;
import com.aifdphub.model.User;
import com.aifdphub.repository.CertificateRepository;
import com.aifdphub.repository.CertificateTemplateRepository;
import com.aifdphub.repository.EnrollmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for managing certificate lifecycle: generation, hashing, and verification.
 */
@Service
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);

    private final CertificateRepository certificateRepository;
    private final CertificateTemplateRepository templateRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ObjectMapper objectMapper;

    public CertificateService(CertificateRepository certificateRepository, 
                              CertificateTemplateRepository templateRepository,
                              EnrollmentRepository enrollmentRepository) {
        this.certificateRepository = certificateRepository;
        this.templateRepository = templateRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Generate a certificate for a faculty member who has completed an FDP.
     */
    public Certificate generateCertificate(User user, FdpProgram fdp, Enrollment enrollment) {
        // Check if certificate already exists
        if (certificateRepository.existsByUserIdAndFdpProgramId(user.getId(), fdp.getId())) {
            return certificateRepository.findByUserId(user.getId()).stream()
                    .filter(c -> c.getFdpProgram().getId().equals(fdp.getId()))
                    .findFirst()
                    .orElseThrow();
        }

        String certificateId = generateCertificateId();
        String certificateHash = generateCertificateHash(certificateId, user, fdp);

        // Fetch template for this FDP
        Optional<CertificateTemplate> activeTemplate = templateRepository.findByFdpId(fdp.getId());
        String templateJson = "";
        try {
            Map<String, Object> flatMap = new HashMap<>();
            if (activeTemplate.isPresent()) {
                CertificateTemplate t = activeTemplate.get();
                flatMap.put("collegeName", t.getInstitutionName() != null ? t.getInstitutionName() : "National Institute of Technology");
                flatMap.put("departmentName", t.getInstitutionSubtitle() != null ? t.getInstitutionSubtitle() : "Department of Computer Science & Engineering");
                flatMap.put("logoUrl", t.getLogo() != null ? t.getLogo() : "");
                flatMap.put("backgroundUrl", t.getBackgroundImage() != null ? t.getBackgroundImage() : "");
                flatMap.put("borderStyle", t.getBorderStyle() != null ? t.getBorderStyle() : "double");
                flatMap.put("fontFamily", "serif");
                flatMap.put("certificateText", t.getDescriptionText() != null ? t.getDescriptionText() : "This is to certify that **{{facultyName}}**\nhas successfully completed the Faculty Development Program on\n**{{courseName}}**\nand achieved an assessment score of **{{score}}%**.");
                flatMap.put("footerText", "Verified via AI FDP Hub Registry Ledger.");
                flatMap.put("enableBlockchain", fdp.getEnableBlockchain() != null && fdp.getEnableBlockchain());
                flatMap.put("enableQr", true);
                
                // Add certificateTemplate style
                flatMap.put("certificateTemplate", fdp.getCertificateTemplate() != null ? fdp.getCertificateTemplate() : "Classic");

                // Parse signatures JSON
                try {
                    if (t.getSignatures() != null && !t.getSignatures().isBlank()) {
                        Map sigs = objectMapper.readValue(t.getSignatures(), Map.class);
                        flatMap.put("principalSignatureUrl", sigs.getOrDefault("principal", ""));
                        flatMap.put("hodSignatureUrl", sigs.getOrDefault("hod", ""));
                        flatMap.put("coordinatorSignatureUrl", sigs.getOrDefault("coordinator", ""));
                    }
                } catch (Exception e) {
                    flatMap.put("principalSignatureUrl", "");
                    flatMap.put("hodSignatureUrl", "");
                    flatMap.put("coordinatorSignatureUrl", "");
                }

                // Parse colors JSON
                try {
                    if (t.getColors() != null && !t.getColors().isBlank()) {
                        Map cols = objectMapper.readValue(t.getColors(), Map.class);
                        flatMap.put("primaryColor", cols.getOrDefault("primary", "#7c3aed"));
                        flatMap.put("secondaryColor", cols.getOrDefault("secondary", "#a78bfa"));
                        flatMap.put("textColor", cols.getOrDefault("text", "#1a1a2e"));
                    }
                } catch (Exception e) {
                    flatMap.put("primaryColor", "#7c3aed");
                    flatMap.put("secondaryColor", "#a78bfa");
                    flatMap.put("textColor", "#1a1a2e");
                }
            } else {
                // Default settings fallback
                flatMap.put("collegeName", "National Institute of Technology");
                flatMap.put("departmentName", "Department of Computer Science & Engineering");
                flatMap.put("logoUrl", "");
                flatMap.put("backgroundUrl", "");
                flatMap.put("principalSignatureUrl", "");
                flatMap.put("hodSignatureUrl", "");
                flatMap.put("coordinatorSignatureUrl", "");
                flatMap.put("borderStyle", "double");
                flatMap.put("fontFamily", "serif");
                flatMap.put("primaryColor", "#7c3aed");
                flatMap.put("secondaryColor", "#a78bfa");
                flatMap.put("textColor", "#1a1a2e");
                flatMap.put("certificateText", "This is to certify that **{{facultyName}}**\nhas successfully completed the Faculty Development Program on\n**{{courseName}}**\nand achieved an assessment score of **{{score}}%**.");
                flatMap.put("footerText", "Verified via AI FDP Hub Registry Ledger.");
                flatMap.put("enableBlockchain", fdp.getEnableBlockchain() != null && fdp.getEnableBlockchain());
                flatMap.put("enableQr", true);
                flatMap.put("certificateTemplate", fdp.getCertificateTemplate() != null ? fdp.getCertificateTemplate() : "Classic");
            }
            templateJson = objectMapper.writeValueAsString(flatMap);
        } catch (Exception e) {
            log.error("Failed to serialize certificate template snapshot: {}", e.getMessage());
        }

        Certificate certificate = new Certificate();
        certificate.setCertificateId(certificateId);
        certificate.setUser(user);
        certificate.setFdpProgram(fdp);
        certificate.setCertificateHash(certificateHash);
        certificate.setTemplateSettings(templateJson);
        certificate.setIsOnChain(false);
        certificate.setIsValid(true);

        return certificateRepository.save(certificate);
    }

    /**
     * Update certificate with blockchain transaction hash.
     */
    public Certificate updateWithBlockchainTx(String certificateId, String txHash) {
        Certificate cert = certificateRepository.findByCertificateId(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found: " + certificateId));

        cert.setTxHash(txHash);
        cert.setIsOnChain(true);
        return certificateRepository.save(cert);
    }

    /**
     * Update certificate with IPFS hash.
     */
    public Certificate updateWithIpfs(String certificateId, String ipfsHash, String ipfsUrl) {
        Certificate cert = certificateRepository.findByCertificateId(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificate not found: " + certificateId));

        cert.setIpfsHash(ipfsHash);
        cert.setIpfsUrl(ipfsUrl);
        return certificateRepository.save(cert);
    }

    /**
     * Verify a certificate by its ID.
     */
    public Map<String, Object> verifyCertificate(String certificateId) {
        Optional<Certificate> certOpt = certificateRepository.findByCertificateId(certificateId);

        if (certOpt.isEmpty()) {
            return Map.of("isValid", false, "message", "Certificate not found");
        }

        Certificate cert = certOpt.get();
        Map<String, Object> result = new HashMap<>();
        result.put("isValid", cert.getIsValid());
        result.put("certificateId", cert.getCertificateId());
        result.put("facultyName", cert.getUser().getName());
        result.put("facultyEmail", cert.getUser().getEmail());
        result.put("fdpName", cert.getFdpProgram().getTitle());
        result.put("fdpCategory", cert.getFdpProgram().getCategory());
        result.put("certificateHash", cert.getCertificateHash());
        result.put("txHash", cert.getTxHash());
        result.put("ipfsUrl", cert.getIpfsUrl());
        result.put("isOnChain", cert.getIsOnChain());
        result.put("issuedAt", cert.getIssuedAt() != null ? cert.getIssuedAt().toString() : null);
        result.put("templateSettings", cert.getTemplateSettings());

        // Fetch user quiz score from enrollment
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByUserIdAndFdpProgramId(cert.getUser().getId(), cert.getFdpProgram().getId());
        if (enrollmentOpt.isPresent()) {
            result.put("quizScore", enrollmentOpt.get().getQuizScore());
        } else {
            result.put("quizScore", 80);
        }

        return result;
    }

    /**
    /**
     * Get all certificates for a user, or all certificates on the platform if userId is null or 0.
     */
    public List<Certificate> getUserCertificates(Long userId) {
        if (userId == null || userId == 0) {
            return certificateRepository.findAll();
        }
        return certificateRepository.findByUserId(userId);
    }

    // ===== Private Helpers =====

    private String generateCertificateId() {
        return "CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateCertificateHash(String certificateId, User user, FdpProgram fdp) {
        String data = certificateId + "|" + user.getId() + "|" + user.getEmail() + "|" +
                fdp.getId() + "|" + fdp.getTitle() + "|" + LocalDateTime.now();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return "0x" + hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
