package com.aifdphub.controller;

import com.aifdphub.model.Certificate;
import com.aifdphub.model.Enrollment;
import com.aifdphub.model.FdpProgram;
import com.aifdphub.model.User;
import com.aifdphub.repository.EnrollmentRepository;
import com.aifdphub.repository.FdpRepository;
import com.aifdphub.repository.UserRepository;
import com.aifdphub.service.CertificateService;
import com.aifdphub.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/certificate")
@CrossOrigin(origins = "*")
public class CertificateController {

    private final CertificateService certificateService;
    private final UserRepository userRepository;
    private final FdpRepository fdpRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    public CertificateController(CertificateService certificateService, UserRepository userRepository,
                                 FdpRepository fdpRepository, EnrollmentRepository enrollmentRepository,
                                 NotificationService notificationService) {
        this.certificateService = certificateService;
        this.userRepository = userRepository;
        this.fdpRepository = fdpRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.notificationService = notificationService;
    }

    @PostMapping("/issue")
    public ResponseEntity<?> issueCertificate(@RequestBody Map<String, Object> request) {
        Long userId = request.get("userId") != null ? Long.parseLong(request.get("userId").toString()) : null;
        Long fdpId = request.get("fdpId") != null ? Long.parseLong(request.get("fdpId").toString()) : null;
        if (userId == null || fdpId == null) return ResponseEntity.badRequest().body(Map.of("error", "userId and fdpId required"));

        Optional<User> userOpt = userRepository.findById(userId);
        Optional<FdpProgram> fdpOpt = fdpRepository.findById(fdpId);
        if (userOpt.isEmpty() || fdpOpt.isEmpty()) return ResponseEntity.notFound().build();

        Optional<Enrollment> enrollOpt = enrollmentRepository.findByUserIdAndFdpProgramId(userId, fdpId);
        if (enrollOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Not enrolled"));

        Certificate cert = certificateService.generateCertificate(userOpt.get(), fdpOpt.get(), enrollOpt.get());

        Long collegeId = fdpOpt.get().getCollege() != null ? fdpOpt.get().getCollege().getId() : null;
        notificationService.createNotification(
            "Certificate Issued",
            "Certificate issued for " + userOpt.get().getName() + " in " + fdpOpt.get().getTitle(),
            "CERTIFICATE",
            "ADMIN",
            null,
            collegeId
        );

        notificationService.createNotification(
            "Certificate Ready",
            "Certificate ready for download in " + fdpOpt.get().getTitle(),
            "CERTIFICATE",
            "FACULTY",
            userId
        );

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Certificate issued successfully");
        res.put("certificateId", cert.getCertificateId());
        res.put("certificateHash", cert.getCertificateHash());
        res.put("isOnChain", cert.getIsOnChain());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateCertificate(@RequestBody Map<String, Object> request) {
        Long userId = request.get("userId") != null ? Long.parseLong(request.get("userId").toString()) : null;
        Long fdpId = request.get("fdpId") != null ? Long.parseLong(request.get("fdpId").toString()) : null;
        if (userId == null || fdpId == null) return ResponseEntity.badRequest().body(Map.of("error", "userId and fdpId required"));

        Optional<User> userOpt = userRepository.findById(userId);
        Optional<FdpProgram> fdpOpt = fdpRepository.findById(fdpId);
        if (userOpt.isEmpty() || fdpOpt.isEmpty()) return ResponseEntity.notFound().build();

        Optional<Enrollment> enrollOpt = enrollmentRepository.findByUserIdAndFdpProgramId(userId, fdpId);
        if (enrollOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Not enrolled"));

        Enrollment enrollment = enrollOpt.get();
        FdpProgram fdp = fdpOpt.get();

        // Check completion criteria
        double passingScore = fdp.getPassingScore() != null ? fdp.getPassingScore() : 60.0;
        boolean modulesFinished = enrollment.getProgressPercentage() >= 100;
        boolean quizPassed = enrollment.getQuizScore() >= passingScore;
        boolean assignmentDone = enrollment.getAssignmentSubmitted() != null && enrollment.getAssignmentSubmitted();

        if (!modulesFinished || !quizPassed || !assignmentDone) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Completion criteria not met",
                "modulesFinished", modulesFinished,
                "quizPassed", quizPassed,
                "assignmentSubmitted", assignmentDone
            ));
        }

        // Generate certificate
        Certificate cert = certificateService.generateCertificate(userOpt.get(), fdp, enrollment);

        Long collegeId = fdp.getCollege() != null ? fdp.getCollege().getId() : null;
        notificationService.createNotification(
            "Certificate Generated",
            "Certificate generated for " + userOpt.get().getName() + " in " + fdp.getTitle(),
            "CERTIFICATE",
            "ADMIN",
            null,
            collegeId
        );

        notificationService.createNotification(
            "Certificate Ready",
            "Certificate ready for download in " + fdp.getTitle(),
            "CERTIFICATE",
            "FACULTY",
            userId
        );

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Certificate generated successfully");
        res.put("certificateId", cert.getCertificateId());
        res.put("certificateHash", cert.getCertificateHash());
        res.put("isOnChain", cert.getIsOnChain());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/verify/{certificateId}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.verifyCertificate(certificateId));
    }

    @PostMapping("/{certificateId}/blockchain")
    public ResponseEntity<?> updateBlockchainTx(@PathVariable String certificateId, @RequestBody Map<String, String> payload) {
        String txHash = payload.get("txHash");
        if (txHash == null) return ResponseEntity.badRequest().body(Map.of("error", "txHash required"));
        Certificate cert = certificateService.updateWithBlockchainTx(certificateId, txHash);
        return ResponseEntity.ok(Map.of("message", "Updated", "certificateId", cert.getCertificateId(), "txHash", cert.getTxHash(), "isOnChain", cert.getIsOnChain()));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyCertificates(@RequestParam Long userId, org.springframework.security.core.Authentication auth) {
        Long collegeId = null;
        if (auth != null && auth.getPrincipal() instanceof User) {
            User authUser = (User) auth.getPrincipal();
            if ("ADMIN".equals(authUser.getRole()) && authUser.getCollege() != null) {
                collegeId = authUser.getCollege().getId();
            }
        }
        return ResponseEntity.ok(certificateService.getUserCertificates(userId, collegeId));
    }
}
