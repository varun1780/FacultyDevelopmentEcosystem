package com.aifdphub.controller;

import com.aifdphub.model.Enrollment;
import com.aifdphub.model.FdpProgram;
import com.aifdphub.model.User;
import com.aifdphub.model.QuizResult;
import com.aifdphub.repository.EnrollmentRepository;
import com.aifdphub.repository.FdpRepository;
import com.aifdphub.repository.UserRepository;
import com.aifdphub.repository.QuizResultRepository;
import com.aifdphub.service.AIService;
import com.aifdphub.service.NotificationService;
import com.aifdphub.service.CertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final FdpRepository fdpRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final NotificationService notificationService;
    private final QuizResultRepository quizResultRepository;
    private final CertificateService certificateService;

    public EnrollmentController(EnrollmentRepository enrollmentRepository,
                                FdpRepository fdpRepository,
                                UserRepository userRepository,
                                AIService aiService,
                                NotificationService notificationService,
                                QuizResultRepository quizResultRepository,
                                CertificateService certificateService) {
        this.enrollmentRepository = enrollmentRepository;
        this.fdpRepository = fdpRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.notificationService = notificationService;
        this.quizResultRepository = quizResultRepository;
        this.certificateService = certificateService;
    }

    @PostMapping("/enrollments/{fdpId}")
    public ResponseEntity<?> enrollFaculty(@PathVariable Long fdpId, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        Optional<FdpProgram> fdpOpt = fdpRepository.findById(fdpId);

        if (userOpt.isEmpty() || fdpOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        FdpProgram fdp = fdpOpt.get();

        // Check if already enrolled
        if (enrollmentRepository.findByUserIdAndFdpProgramId(userId, fdpId).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User is already enrolled in this FDP"));
        }

        // Check seat availability
        if (fdp.getMaxSeats() != null && fdp.getEnrolledCount() >= fdp.getMaxSeats()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No seats available"));
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setFdpProgram(fdp);
        enrollment.setCollege(fdp.getCollege());

        // Increment enrolled count
        fdp.setEnrolledCount(fdp.getEnrolledCount() + 1);
        fdpRepository.save(fdp);

        Enrollment saved = enrollmentRepository.save(enrollment);

        Long collegeId = fdp.getCollege() != null ? fdp.getCollege().getId() : null;
        notificationService.createNotification(
            "New FDP Enrollment",
            user.getName() + " enrolled in " + fdp.getTitle(),
            "ENROLLMENT",
            "ADMIN",
            null,
            collegeId
        );

        notificationService.createNotification(
            "Enrollment Approved",
            "Your enrollment in " + fdp.getTitle() + " has been approved.",
            "ENROLLMENT",
            "FACULTY",
            user.getId()
        );

        notificationService.createNotification(
            "Assignment Deadline Approaching",
            "Assignment deadline approaching for FDP: " + fdp.getTitle(),
            "SYSTEM",
            "FACULTY",
            user.getId()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Successfully enrolled in " + fdp.getTitle());
        response.put("enrollment", saved);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/enrollments/my")
    public ResponseEntity<?> getMyEnrollments(@RequestParam Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        return ResponseEntity.ok(enrollments);
    }

    @PostMapping("/enrollments/{id}/complete-module")
    public ResponseEntity<?> updateProgress(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        Integer progress = payload.get("progressPercentage");
        Integer completedModules = payload.get("completedModules");

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(id);

        if (enrollmentOpt.isPresent()) {
            Enrollment enrollment = enrollmentOpt.get();
            boolean previouslyCompleted = enrollment.getIsCompleted() != null && enrollment.getIsCompleted();
            
            if (progress != null) {
                enrollment.setProgressPercentage(progress);
            }
            if (completedModules != null) {
                enrollment.setCompletedModules(completedModules);
            }
            if (progress != null && progress >= 100) {
                enrollment.setIsCompleted(true);
                enrollment.setCompletedAt(LocalDateTime.now());
            }
            
            Enrollment saved = enrollmentRepository.save(enrollment);

            if (saved.getIsCompleted() && !previouslyCompleted) {
                Long collegeId = enrollment.getFdpProgram().getCollege() != null ? enrollment.getFdpProgram().getCollege().getId() : null;
                notificationService.createNotification(
                    "FDP Completed",
                    enrollment.getUser().getName() + " has completed the FDP: " + enrollment.getFdpProgram().getTitle(),
                    "SYSTEM",
                    "ADMIN",
                    null,
                    collegeId
                );
                notificationService.createNotification(
                    "FDP Completed",
                    "Congratulations! You have completed the FDP: " + enrollment.getFdpProgram().getTitle(),
                    "SYSTEM",
                    "FACULTY",
                    enrollment.getUser().getId()
                );
            }
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/quiz/submit")
    public ResponseEntity<?> submitQuizGeneral(@RequestBody Map<String, Object> payload) {
        Long enrollmentId = payload.get("enrollmentId") != null ? Long.parseLong(payload.get("enrollmentId").toString()) : null;
        if (enrollmentId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "enrollmentId is required"));
        }
        return submitQuiz(enrollmentId, payload);
    }

    @PostMapping("/assignment/submit")
    public ResponseEntity<?> submitAssignment(@RequestBody Map<String, Object> payload) {
        Long enrollmentId = payload.get("enrollmentId") != null ? Long.parseLong(payload.get("enrollmentId").toString()) : null;
        if (enrollmentId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "enrollmentId is required"));
        }

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(enrollmentId);
        if (enrollmentOpt.isEmpty()) return ResponseEntity.notFound().build();

        Enrollment enrollment = enrollmentOpt.get();
        boolean previouslyCompleted = enrollment.getIsCompleted() != null && enrollment.getIsCompleted();
        enrollment.setAssignmentSubmitted(true);
        enrollment.setAssignmentScore(85.0); // Passing score by default

        // check if FDP is completed (both modules complete and quiz/assignment passed)
        FdpProgram fdp = enrollment.getFdpProgram();
        double passingScore = fdp.getPassingScore() != null ? fdp.getPassingScore() : 60.0;
        if (enrollment.getQuizScore() >= passingScore && enrollment.getProgressPercentage() >= 100) {
            enrollment.setIsCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
        }

        Enrollment saved = enrollmentRepository.save(enrollment);

        Long collegeId = fdp.getCollege() != null ? fdp.getCollege().getId() : null;
        notificationService.createNotification(
            "Assignment Submitted Successfully",
            "Assignment submitted successfully by " + saved.getUser().getName() + " for " + fdp.getTitle(),
            "ASSIGNMENT",
            "ADMIN",
            null,
            collegeId
        );

        if (saved.getIsCompleted() && !previouslyCompleted) {
            notificationService.createNotification(
                "FDP Completed",
                saved.getUser().getName() + " has completed the FDP: " + fdp.getTitle(),
                "SYSTEM",
                "ADMIN",
                null,
                collegeId
            );
            notificationService.createNotification(
                "FDP Completed",
                "Congratulations! You have completed the FDP: " + fdp.getTitle(),
                "SYSTEM",
                "FACULTY",
                saved.getUser().getId()
            );

            // Auto-issue certificate
            try {
                certificateService.generateCertificate(saved.getUser(), fdp, saved);
            } catch (Exception e) {
                System.err.println("Error auto-generating certificate on assignment submission: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
            "message", "Assignment submitted successfully",
            "assignmentSubmitted", true,
            "assignmentScore", 85.0,
            "isCompleted", saved.getIsCompleted()
        ));
    }

    /**
     * Submit quiz answers and get AI evaluation.
     */
    @PostMapping("/enrollments/{id}/submit-quiz")
    public ResponseEntity<?> submitQuiz(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findById(id);
        if (enrollmentOpt.isEmpty()) return ResponseEntity.notFound().build();

        Enrollment enrollment = enrollmentOpt.get();
        Object answers = payload.get("answers");
        Object correctAnswers = payload.get("correctAnswers");

        // Get AI evaluation
        Map<String, Object> evaluation = aiService.evaluateAnswers(
                enrollment.getFdpProgram().getTitle(), answers, correctAnswers);

        // Update enrollment with results — use percentage (the real scored value)
        Object pctObj = evaluation.get("percentage");
        double score = pctObj instanceof Number ? ((Number) pctObj).doubleValue() : 0.0;

        enrollment.setQuizScore(score);
        enrollment.setQuizAttempts(enrollment.getQuizAttempts() + 1);

        // Store the submitted answers JSON
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            enrollment.setQuizAnswers(mapper.writeValueAsString(answers));
        } catch (Exception ignored) {}

        // Store AI feedback
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            enrollment.setAiFeedback(mapper.writeValueAsString(evaluation));
        } catch (Exception e) {
            enrollment.setAiFeedback(evaluation.toString());
        }

        boolean previouslyCompleted = enrollment.getIsCompleted() != null && enrollment.getIsCompleted();
        
        // Check if passed
        FdpProgram fdp = enrollment.getFdpProgram();
        if (score >= (fdp.getPassingScore() != null ? fdp.getPassingScore() : 60.0)) {
            enrollment.setIsCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
            enrollment.setProgressPercentage(100);
        }

        Enrollment saved = enrollmentRepository.save(enrollment);

        Long collegeId = fdp.getCollege() != null ? fdp.getCollege().getId() : null;
        notificationService.createNotification(
            "Quiz Completed",
            saved.getUser().getName() + " completed quiz for " + fdp.getTitle() + " with score " + score + "%",
            "QUIZ",
            "ADMIN",
            null,
            collegeId
        );

        if (saved.getIsCompleted() && !previouslyCompleted) {
            notificationService.createNotification(
                "FDP Completed",
                saved.getUser().getName() + " has completed the FDP: " + fdp.getTitle(),
                "SYSTEM",
                "ADMIN",
                null,
                collegeId
            );
            notificationService.createNotification(
                "FDP Completed",
                "Congratulations! You have completed the FDP: " + fdp.getTitle(),
                "SYSTEM",
                "FACULTY",
                saved.getUser().getId()
            );

            // Auto-issue certificate
            try {
                certificateService.generateCertificate(saved.getUser(), fdp, saved);
            } catch (Exception e) {
                System.err.println("Error auto-generating certificate on quiz submission: " + e.getMessage());
            }
        }

        // Save Quiz Result in database
        try {
            QuizResult quizResult = new QuizResult();
            quizResult.setFacultyId(enrollment.getUser().getId());
            quizResult.setFdpId(enrollment.getFdpProgram().getId());
            quizResult.setCollegeId(fdp.getCollege() != null ? fdp.getCollege().getId() : null);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            quizResult.setAnswers(mapper.writeValueAsString(answers));
            quizResult.setScore(score);
            quizResult.setPassed(score >= (fdp.getPassingScore() != null ? fdp.getPassingScore() : 60.0));
            quizResult.setCompletedAt(LocalDateTime.now());
            quizResultRepository.save(quizResult);
        } catch (Exception e) {
            System.err.println("Error saving quiz result: " + e.getMessage());
        }

        Map<String, Object> response = new HashMap<>(evaluation);
        response.put("enrollmentId", saved.getId());
        response.put("passed", saved.getIsCompleted());
        return ResponseEntity.ok(response);
    }
}
