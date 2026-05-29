package com.aifdphub.controller;

import com.aifdphub.model.*;
import com.aifdphub.repository.*;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        // Overview stats
        long totalFaculty = userRepository.countByRole("FACULTY");
        long totalUsers = userRepository.count();
        long totalFdps = fdpRepository.count();
        long activeFdps = fdpRepository.countByStatus("Active");
        long totalEnrollments = enrollmentRepository.count();
        long completedEnrollments = enrollmentRepository.countByIsCompleted(true);
        long totalCertificates = certificateRepository.count();

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
        List<FdpProgram> allFdps = fdpRepository.findAll();
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
        List<FdpProgram> recentFdps = fdpRepository.findAllByOrderByCreatedAtDesc();
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
        List<Enrollment> allEnrollments = enrollmentRepository.findAll();
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
