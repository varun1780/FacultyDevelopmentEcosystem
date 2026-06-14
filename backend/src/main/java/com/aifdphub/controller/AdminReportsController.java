package com.aifdphub.controller;

import com.aifdphub.model.*;
import com.aifdphub.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = "*")
public class AdminReportsController {

    private final UserRepository userRepository;
    private final FdpRepository fdpRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;

    public AdminReportsController(UserRepository userRepository, FdpRepository fdpRepository,
                                  EnrollmentRepository enrollmentRepository, CertificateRepository certificateRepository) {
        this.userRepository = userRepository;
        this.fdpRepository = fdpRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.certificateRepository = certificateRepository;
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();

        User admin = (User) auth.getPrincipal();
        Long collegeId = admin.getCollege() != null ? admin.getCollege().getId() : null;
        if (collegeId == null) return ResponseEntity.status(403).build();

        Map<String, Object> summary = new HashMap<>();
        long totalFdps = fdpRepository.countByCollegeId(collegeId);
        
        List<Enrollment> collegeEnrollments = enrollmentRepository.findByFdpProgramCollegeId(collegeId);
        long totalFaculty = collegeEnrollments.stream().map(e -> e.getUser().getId()).distinct().count();
        
        long totalEnrollments = enrollmentRepository.countByFdpProgramCollegeId(collegeId);
        long completedEnrollments = enrollmentRepository.countByFdpProgramCollegeIdAndIsCompleted(collegeId, true);
        long totalCertificates = certificateRepository.countByFdpProgramCollegeId(collegeId);

        double avgScore = collegeEnrollments.stream()
                .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                .mapToDouble(Enrollment::getQuizScore)
                .average().orElse(0.0);

        summary.put("totalFdps", totalFdps);
        summary.put("totalFaculty", totalFaculty);
        summary.put("totalEnrollments", totalEnrollments);
        summary.put("completedEnrollments", completedEnrollments);
        summary.put("totalCertificates", totalCertificates);
        summary.put("averageScore", Math.round(avgScore * 10) / 10.0);
        summary.put("completionRate", totalEnrollments > 0
                ? Math.round((completedEnrollments * 100.0 / totalEnrollments) * 10) / 10.0 : 0);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/fdp-enrollments")
    public ResponseEntity<?> getFdpEnrollments(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();

        User admin = (User) auth.getPrincipal();
        Long collegeId = admin.getCollege() != null ? admin.getCollege().getId() : null;
        if (collegeId == null) return ResponseEntity.status(403).build();

        List<FdpProgram> fdps = fdpRepository.findByCollegeId(collegeId);
        List<Enrollment> allEnrollments = enrollmentRepository.findByFdpProgramCollegeId(collegeId);

        List<Map<String, Object>> report = fdps.stream().map(fdp -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("fdpId", fdp.getId());
            row.put("title", fdp.getTitle());
            row.put("category", fdp.getCategory());
            row.put("status", fdp.getStatus());

            List<Enrollment> fdpEnrollments = allEnrollments.stream()
                    .filter(e -> e.getFdpProgram().getId().equals(fdp.getId()))
                    .collect(Collectors.toList());

            long enrolled = fdpEnrollments.size();
            long completed = fdpEnrollments.stream().filter(e -> Boolean.TRUE.equals(e.getIsCompleted())).count();
            double avgScore = fdpEnrollments.stream()
                    .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                    .mapToDouble(Enrollment::getQuizScore)
                    .average().orElse(0.0);

            row.put("totalEnrolled", enrolled);
            row.put("completed", completed);
            row.put("inProgress", enrolled - completed);
            row.put("averageScore", Math.round(avgScore * 10) / 10.0);
            row.put("completionRate", enrolled > 0
                    ? Math.round((completed * 100.0 / enrolled) * 10) / 10.0 : 0);
            row.put("maxSeats", fdp.getMaxSeats());
            row.put("startDate", fdp.getStartDate());
            row.put("endDate", fdp.getEndDate());
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(report);
    }

    @GetMapping("/faculty-performance")
    public ResponseEntity<?> getFacultyPerformance(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();

        User admin = (User) auth.getPrincipal();
        Long collegeId = admin.getCollege() != null ? admin.getCollege().getId() : null;
        if (collegeId == null) return ResponseEntity.status(403).build();

        List<Enrollment> allEnrollments = enrollmentRepository.findByFdpProgramCollegeId(collegeId);
        List<User> faculty = allEnrollments.stream().map(Enrollment::getUser).distinct().collect(Collectors.toList());
        List<Certificate> allCerts = certificateRepository.findByFdpProgramCollegeId(collegeId);

        List<Map<String, Object>> report = faculty.stream().map(f -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", f.getId());
            row.put("name", f.getName());
            row.put("email", f.getEmail());
            row.put("department", f.getDepartment());

            List<Enrollment> userEnrollments = allEnrollments.stream()
                    .filter(e -> e.getUser().getId().equals(f.getId()))
                    .collect(Collectors.toList());

            long enrolled = userEnrollments.size();
            long completed = userEnrollments.stream().filter(e -> Boolean.TRUE.equals(e.getIsCompleted())).count();
            double avgScore = userEnrollments.stream()
                    .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                    .mapToDouble(Enrollment::getQuizScore)
                    .average().orElse(0.0);
            double bestScore = userEnrollments.stream()
                    .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                    .mapToDouble(Enrollment::getQuizScore)
                    .max().orElse(0.0);

            long certs = allCerts.stream().filter(c -> c.getUser().getId().equals(f.getId())).count();

            row.put("totalEnrolled", enrolled);
            row.put("completed", completed);
            row.put("averageScore", Math.round(avgScore * 10) / 10.0);
            row.put("bestScore", Math.round(bestScore * 10) / 10.0);
            row.put("certificates", certs);
            row.put("status", f.getStatus());
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(report);
    }

    @GetMapping("/certificates")
    public ResponseEntity<?> getCertificates(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();

        User admin = (User) auth.getPrincipal();
        Long collegeId = admin.getCollege() != null ? admin.getCollege().getId() : null;
        if (collegeId == null) return ResponseEntity.status(403).build();

        List<Certificate> certs = certificateRepository.findByFdpProgramCollegeId(collegeId);

        List<Map<String, Object>> report = certs.stream().map(c -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("certificateId", c.getCertificateId());
            row.put("facultyName", c.getUser().getName());
            row.put("facultyEmail", c.getUser().getEmail());
            row.put("fdpTitle", c.getFdpProgram().getTitle());
            row.put("issuedAt", c.getIssuedAt());
            row.put("isOnChain", c.getIsOnChain());
            row.put("isValid", c.getIsValid());
            row.put("txHash", c.getTxHash());
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(report);
    }
}
