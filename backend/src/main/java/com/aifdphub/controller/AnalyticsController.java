package com.aifdphub.controller;

import com.aifdphub.model.*;
import com.aifdphub.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final UserRepository userRepository;
    private final FdpRepository fdpRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;

    public AnalyticsController(UserRepository userRepository, FdpRepository fdpRepository,
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

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();

        User admin = (User) auth.getPrincipal();
        Long collegeId = admin.getCollege() != null ? admin.getCollege().getId() : null;
        if (collegeId == null) return ResponseEntity.status(403).build();

        Map<String, Object> analytics = new HashMap<>();

        // Fetch data scoped to college
        List<FdpProgram> allFdps = fdpRepository.findByCollegeId(collegeId);
        List<Enrollment> allEnrollments = enrollmentRepository.findByFdpProgramCollegeId(collegeId);
        List<Certificate> allCerts = certificateRepository.findByFdpProgramCollegeId(collegeId);

        // Overview stats
        long totalFaculty = allEnrollments.stream().map(e -> e.getUser().getId()).distinct().count();
        long totalUsers = totalFaculty; // Admins only care about faculty in their college
        long totalFdps = allFdps.size();
        long activeFdps = allFdps.stream().filter(f -> "Active".equalsIgnoreCase(f.getStatus())).count();
        long totalEnrollments = allEnrollments.size();
        long completedEnrollments = allEnrollments.stream().filter(e -> Boolean.TRUE.equals(e.getIsCompleted())).count();
        long totalCertificates = allCerts.size();

        analytics.put("totalFaculty", totalFaculty);
        analytics.put("totalUsers", totalUsers);
        analytics.put("totalFdps", totalFdps);
        analytics.put("activeFdps", activeFdps);
        analytics.put("totalEnrollments", totalEnrollments);
        analytics.put("completedEnrollments", completedEnrollments);
        analytics.put("totalCertificates", totalCertificates);
        analytics.put("completionRate", totalEnrollments > 0
                ? Math.round((completedEnrollments * 100.0 / totalEnrollments) * 10) / 10.0 : 0);

        // Category distribution
        Map<String, Long> categoryDist = allFdps.stream()
                .filter(f -> f.getCategory() != null)
                .collect(Collectors.groupingBy(FdpProgram::getCategory, Collectors.counting()));
        analytics.put("categoryDistribution", categoryDist);

        // Status distribution
        Map<String, Long> statusDist = allFdps.stream()
                .filter(f -> f.getStatus() != null)
                .collect(Collectors.groupingBy(FdpProgram::getStatus, Collectors.counting()));
        analytics.put("statusDistribution", statusDist);

        // Recent FDPs (sorted by creation date, limited to 5)
        List<FdpProgram> recentFdps = allFdps.stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
        List<Map<String, Object>> recentFdpsList = recentFdps.stream()
                .limit(5)
                .map(f -> {
                    Map<String, Object> fdpMap = new HashMap<>();
                    fdpMap.put("id", f.getId());
                    fdpMap.put("title", f.getTitle());
                    fdpMap.put("category", f.getCategory());
                    fdpMap.put("duration", f.getDuration());
                    fdpMap.put("status", f.getStatus());
                    fdpMap.put("enrolledCount", f.getEnrolledCount());
                    fdpMap.put("maxSeats", f.getMaxSeats());
                    fdpMap.put("createdAt", f.getCreatedAt());
                    return fdpMap;
                })
                .collect(Collectors.toList());
        analytics.put("recentFdps", recentFdpsList);

        // Faculty performance (top performers)
        List<Map<String, Object>> topPerformers = allEnrollments.stream()
                .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                .sorted((a, b) -> Double.compare(b.getQuizScore(), a.getQuizScore()))
                .limit(10)
                .map(e -> {
                    Map<String, Object> perf = new HashMap<>();
                    perf.put("facultyName", e.getUser().getName());
                    perf.put("fdpName", e.getFdpProgram().getTitle());
                    perf.put("score", e.getQuizScore());
                    perf.put("progress", e.getProgressPercentage());
                    perf.put("status", e.getStatus());
                    long certCount = allCerts.stream().filter(c -> c.getUser().getId().equals(e.getUser().getId())).count();
                    perf.put("certificates", certCount);
                    return perf;
                })
                .collect(Collectors.toList());
        analytics.put("topPerformers", topPerformers);

        // Enrollment trends (by month - using enrolledAt)
        Map<String, Long> enrollmentTrends = allEnrollments.stream()
                .filter(e -> e.getEnrolledAt() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getEnrolledAt().getMonth().toString(),
                        Collectors.counting()
                ));
        analytics.put("enrollmentTrends", enrollmentTrends);

        // Average quiz score
        double avgScore = allEnrollments.stream()
                .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                .mapToDouble(Enrollment::getQuizScore)
                .average()
                .orElse(0.0);
        analytics.put("averageQuizScore", Math.round(avgScore * 10) / 10.0);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/faculty")
    public ResponseEntity<?> getFacultyAnalytics(@RequestParam Long userId) {
        Map<String, Object> analytics = new HashMap<>();

        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        long completed = enrollments.stream().filter(e -> Boolean.TRUE.equals(e.getIsCompleted())).count();
        double avgScore = enrollments.stream()
                .filter(e -> e.getQuizScore() != null && e.getQuizScore() > 0)
                .mapToDouble(Enrollment::getQuizScore)
                .average().orElse(0.0);

        analytics.put("totalEnrolled", enrollments.size());
        analytics.put("completed", completed);
        analytics.put("inProgress", enrollments.size() - completed);
        analytics.put("averageScore", Math.round(avgScore * 10) / 10.0);
        analytics.put("certificates", certificateRepository.findByUserId(userId).size());

        List<Map<String, Object>> enrollmentDetails = enrollments.stream().map(e -> {
            Map<String, Object> detail = new HashMap<>();
            detail.put("fdpTitle", e.getFdpProgram().getTitle());
            detail.put("progress", e.getProgressPercentage());
            detail.put("score", e.getQuizScore());
            detail.put("status", e.getStatus());
            detail.put("enrolledAt", e.getEnrolledAt());
            return detail;
        }).collect(Collectors.toList());
        analytics.put("enrollments", enrollmentDetails);

        return ResponseEntity.ok(analytics);
    }
}
