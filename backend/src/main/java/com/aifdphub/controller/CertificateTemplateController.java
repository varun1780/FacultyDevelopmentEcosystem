package com.aifdphub.controller;

import com.aifdphub.model.CertificateTemplate;
import com.aifdphub.repository.CertificateTemplateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CertificateTemplateController {

    private final CertificateTemplateRepository templateRepository;

    public CertificateTemplateController(CertificateTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/fdp/{fdpId}/certificate-template")
    public ResponseEntity<?> getTemplateByFdp(@PathVariable Long fdpId) {
        Optional<CertificateTemplate> templateOpt = templateRepository.findByFdpId(fdpId);
        if (templateOpt.isPresent()) {
            return ResponseEntity.ok(templateOpt.get());
        }

        // Return a default populated template for this FDP
        CertificateTemplate def = new CertificateTemplate();
        def.setFdpId(fdpId);
        def.setTitle("Certificate of Completion");
        def.setInstitutionName("National Institute of Technology");
        def.setInstitutionSubtitle("Department of Computer Science & Engineering");
        def.setBorderStyle("double");
        def.setColors("{\"primary\":\"#7c3aed\",\"secondary\":\"#a78bfa\",\"text\":\"#1a1a2e\"}");
        def.setSignatures("{\"principal\":\"\",\"hod\":\"\",\"coordinator\":\"\"}");
        def.setDescriptionText("This is to certify that **{{facultyName}}**\nhas successfully completed the Faculty Development Program on\n**{{courseName}}**\nand achieved an assessment score of **{{score}}%**.");
        def.setBackgroundImage("");
        def.setLogo("");

        return ResponseEntity.ok(def);
    }

    @PutMapping("/fdp/{fdpId}/certificate-template")
    public ResponseEntity<?> updateTemplateByFdp(@PathVariable Long fdpId, @RequestBody CertificateTemplate updatedData) {
        // Find existing template or create a new one
        Optional<CertificateTemplate> existingOpt = templateRepository.findByFdpId(fdpId);
        CertificateTemplate target = existingOpt.orElse(new CertificateTemplate());

        target.setFdpId(fdpId);
        target.setTitle(updatedData.getTitle());
        target.setInstitutionName(updatedData.getInstitutionName());
        target.setInstitutionSubtitle(updatedData.getInstitutionSubtitle());
        target.setLogo(updatedData.getLogo());
        target.setSignatures(updatedData.getSignatures());
        target.setColors(updatedData.getColors());
        target.setBorderStyle(updatedData.getBorderStyle());
        target.setBackgroundImage(updatedData.getBackgroundImage());
        target.setDescriptionText(updatedData.getDescriptionText());

        CertificateTemplate saved = templateRepository.save(target);
        return ResponseEntity.ok(saved);
    }

    // Keep active template endpoint for fallback compatibility mapping to fdpId 0
    @GetMapping("/certificate-templates/active")
    public ResponseEntity<?> getActiveTemplate() {
        return getTemplateByFdp(0L);
    }

    @PutMapping("/admin/certificate-templates/active")
    public ResponseEntity<?> updateActiveTemplate(Authentication auth, @RequestBody CertificateTemplate updatedData) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin role required."));
        }
        return updateTemplateByFdp(0L, updatedData);
    }
}
