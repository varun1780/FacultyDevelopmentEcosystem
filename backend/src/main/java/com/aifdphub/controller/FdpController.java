package com.aifdphub.controller;

import com.aifdphub.model.FdpProgram;
import com.aifdphub.model.User;
import com.aifdphub.model.Enrollment;
import com.aifdphub.repository.FdpRepository;
import com.aifdphub.repository.EnrollmentRepository;
import com.aifdphub.repository.UserRepository;
import com.aifdphub.repository.CertificateRepository;
import com.aifdphub.repository.FdpModuleRepository;
import com.aifdphub.repository.NotificationRepository;
import com.aifdphub.repository.QuizResultRepository;
import com.aifdphub.service.AIService;
import com.aifdphub.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FdpController {

    private final FdpRepository fdpRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final NotificationService notificationService;
    private final CertificateRepository certificateRepository;
    private final FdpModuleRepository fdpModuleRepository;
    private final NotificationRepository notificationRepository;
    private final QuizResultRepository quizResultRepository;

    public FdpController(FdpRepository fdpRepository,
                         EnrollmentRepository enrollmentRepository,
                         UserRepository userRepository,
                         AIService aiService,
                         NotificationService notificationService,
                         CertificateRepository certificateRepository,
                         FdpModuleRepository fdpModuleRepository,
                         NotificationRepository notificationRepository,
                         QuizResultRepository quizResultRepository) {
        this.fdpRepository = fdpRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.notificationService = notificationService;
        this.certificateRepository = certificateRepository;
        this.fdpModuleRepository = fdpModuleRepository;
        this.notificationRepository = notificationRepository;
        this.quizResultRepository = quizResultRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    @PostMapping("/fdp/create")
    public ResponseEntity<?> createFdp(@Valid @RequestBody FdpProgram fdpProgram) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null && "ADMIN".equals(currentUser.getRole())) {
                fdpProgram.setCreatedBy(currentUser.getId());
                fdpProgram.setCollege(currentUser.getCollege());
            }

            if ("ai".equalsIgnoreCase(fdpProgram.getMode())) {
                String topic = fdpProgram.getTitle();
                if (topic == null || topic.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Topic is required for AI generation"));
                }
                
                int maxSeats = fdpProgram.getMaxSeats() != null ? fdpProgram.getMaxSeats() : 30;
                
                Map<String, Object> generated = aiService.aiGenerateFdp(
                    topic, fdpProgram.getCategory(), fdpProgram.getDifficultyLevel(), 
                    fdpProgram.getDuration(), fdpProgram.getInstructorName(), maxSeats);
                    
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                
                fdpProgram.setTitle((String) generated.getOrDefault("title", topic));
                fdpProgram.setDescription((String) generated.getOrDefault("description", ""));
                fdpProgram.setStatus("Active");
                
                Object lo = generated.get("learningOutcomes");
                if (lo instanceof List) {
                    List<?> list = (List<?>) lo;
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < list.size(); i++) {
                        sb.append(list.get(i).toString());
                        if (i < list.size() - 1) sb.append(", ");
                    }
                    fdpProgram.setLearningOutcomes(sb.toString());
                } else if (lo instanceof String) {
                    fdpProgram.setLearningOutcomes((String) lo);
                }
                
                fdpProgram.setCompletionCriteria((String) generated.get("completionCriteria"));
                
                Object res = generated.get("recommendedResources");
                if (res != null) {
                    if (res instanceof String) {
                        fdpProgram.setRecommendedResources((String) res);
                    } else {
                        fdpProgram.setRecommendedResources(mapper.writeValueAsString(res));
                    }
                }
                
                Object ps = generated.get("passingScore");
                if (ps instanceof Number) {
                    fdpProgram.setPassingScore(((Number) ps).doubleValue());
                }
                
                if (generated.containsKey("modules")) {
                    fdpProgram.setModules(mapper.writeValueAsString(generated.get("modules")));
                }
                if (generated.containsKey("quizzes")) {
                    fdpProgram.setQuiz(mapper.writeValueAsString(Map.of("questions", generated.get("quizzes"))));
                }
                if (generated.containsKey("assignments")) {
                    fdpProgram.setAssignment(mapper.writeValueAsString(generated.get("assignments")));
                }
                
                FdpProgram savedFdp = fdpRepository.save(fdpProgram);
                Long collegeId = savedFdp.getCollege() != null ? savedFdp.getCollege().getId() : null;
                notificationService.createNotification(
                    "AI Content Generated",
                    "AI Content generated and saved: " + savedFdp.getTitle(),
                    "SYSTEM",
                    "ADMIN",
                    null,
                    collegeId
                );
                return ResponseEntity.ok(savedFdp);
            } else {
                // Manual mode
                FdpProgram savedFdp = fdpRepository.save(fdpProgram);
                Long collegeId = savedFdp.getCollege() != null ? savedFdp.getCollege().getId() : null;
                notificationService.createNotification(
                    "New FDP Available",
                    "New FDP available: " + savedFdp.getTitle(),
                    "SYSTEM",
                    "FACULTY",
                    null,
                    collegeId
                );
                return ResponseEntity.ok(savedFdp);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save FDP", "details", e.getMessage()));
        }
    }

    @GetMapping({"/fdp/all", "/fdps"})
    public ResponseEntity<List<FdpProgram>> getAllFdps(
            @RequestParam(required = false) Long collegeId,
            @RequestParam(required = false) String category) {
        
        User currentUser = getCurrentUser();
        List<FdpProgram> fdps;

        // If an Admin is requesting FDPs (e.g. for their dashboard), force filter to their college
        if (currentUser != null && "ADMIN".equals(currentUser.getRole()) && currentUser.getCollege() != null) {
            fdps = fdpRepository.findByCollegeId(currentUser.getCollege().getId());
            if (category != null) {
                fdps = fdps.stream().filter(f -> category.equalsIgnoreCase(f.getCategory())).toList();
            }
            return ResponseEntity.ok(fdps);
        }

        // Faculty logic: they can see all colleges or filter by a specific college
        if (collegeId != null && category != null) {
            fdps = fdpRepository.findByCollegeId(collegeId).stream()
                   .filter(f -> category.equalsIgnoreCase(f.getCategory()))
                   .toList();
        } else if (collegeId != null) {
            fdps = fdpRepository.findByCollegeId(collegeId);
        } else if (category != null) {
            fdps = fdpRepository.findByCategory(category);
        } else {
            fdps = fdpRepository.findAll();
        }
        return ResponseEntity.ok(fdps);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(fdpRepository.findDistinctCategories());
    }

    @GetMapping({"/fdp/{id}", "/fdps/{id}"})
    public ResponseEntity<?> getFdpById(@PathVariable Long id) {
        Optional<FdpProgram> fdp = fdpRepository.findById(id);
        if (fdp.isPresent()) {
            return ResponseEntity.ok(fdp.get());
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/fdp/{id}")
    public ResponseEntity<?> updateFdp(@PathVariable Long id, @RequestBody FdpProgram fdpDetails) {
        Optional<FdpProgram> optionalFdp = fdpRepository.findById(id);
        if (optionalFdp.isPresent()) {
            FdpProgram fdp = optionalFdp.get();
            
            User currentUser = getCurrentUser();
            if (currentUser != null && "ADMIN".equals(currentUser.getRole())) {
                if (fdp.getCollege() == null || currentUser.getCollege() == null || 
                    !fdp.getCollege().getId().equals(currentUser.getCollege().getId())) {
                    return ResponseEntity.status(403).body(Map.of("message", "Unauthorized access. FDP belongs to another institution."));
                }
            }

            String oldModules = fdp.getModules();
            String oldQuiz = fdp.getQuiz();

            fdp.setTitle(fdpDetails.getTitle());
            fdp.setDescription(fdpDetails.getDescription());
            fdp.setCategory(fdpDetails.getCategory());
            fdp.setDuration(fdpDetails.getDuration());
            fdp.setDifficultyLevel(fdpDetails.getDifficultyLevel());
            fdp.setInstructorName(fdpDetails.getInstructorName());
            fdp.setStartDate(fdpDetails.getStartDate());
            fdp.setEndDate(fdpDetails.getEndDate());
            fdp.setMaxSeats(fdpDetails.getMaxSeats());
            fdp.setLearningOutcomes(fdpDetails.getLearningOutcomes());
            fdp.setPrerequisites(fdpDetails.getPrerequisites());
            fdp.setCompletionCriteria(fdpDetails.getCompletionCriteria());
            fdp.setStatus(fdpDetails.getStatus());
            fdp.setPassingScore(fdpDetails.getPassingScore());
            fdp.setThumbnailUrl(fdpDetails.getThumbnailUrl());
            fdp.setEnableCertificate(fdpDetails.getEnableCertificate());
            fdp.setEnableBlockchain(fdpDetails.getEnableBlockchain());
            fdp.setCertificateTemplate(fdpDetails.getCertificateTemplate());
            fdp.setIsPrivate(fdpDetails.getIsPrivate());
            fdp.setEnrollmentDeadline(fdpDetails.getEnrollmentDeadline());
            fdp.setMaxAttempts(fdpDetails.getMaxAttempts());
            fdp.setRecommendedResources(fdpDetails.getRecommendedResources());
            if (fdpDetails.getModules() != null) fdp.setModules(fdpDetails.getModules());
            if (fdpDetails.getQuiz() != null) fdp.setQuiz(fdpDetails.getQuiz());
            if (fdpDetails.getAssignment() != null) fdp.setAssignment(fdpDetails.getAssignment());
            
            FdpProgram saved = fdpRepository.save(fdp);

            triggerUpdateNotifications(oldModules, oldQuiz, saved);

            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/fdp/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteFdp(@PathVariable Long id) {
        try {
            Optional<FdpProgram> optionalFdp = fdpRepository.findById(id);
            if (optionalFdp.isPresent()) {
                FdpProgram fdp = optionalFdp.get();

                User currentUser = getCurrentUser();
                if (currentUser != null && "ADMIN".equals(currentUser.getRole())) {
                    if (fdp.getCollege() == null || currentUser.getCollege() == null || 
                        !fdp.getCollege().getId().equals(currentUser.getCollege().getId())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Unauthorized access. FDP belongs to another institution."));
                    }
                }

                String fdpTitle = fdp.getTitle();
                
                // 1. Quiz Results
                quizResultRepository.deleteByFdpId(id);
                
                // 2. Modules
                fdpModuleRepository.deleteByFdpProgramId(id);
                
                // 3. Certificates
                certificateRepository.deleteByFdpProgramId(id);
                
                // 4. Enrollments
                enrollmentRepository.deleteByFdpProgramId(id);
                
                // 5. Notifications containing the FDP title
                if (fdpTitle != null && !fdpTitle.isBlank()) {
                    notificationRepository.deleteByMessageContaining(fdpTitle);
                }
                
                // 6. FDP Program
                fdpRepository.delete(fdp);
                
                return ResponseEntity.ok(Map.of("message", "FDP Program deleted successfully"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to delete FDP Program due to database constraints or other error", 
                "message", e.getMessage()
            ));
        }
    }

    // Removed redundant aiGenerateFdp, generateAndSaveFdp, adminCreateFdp

    @PutMapping("/admin/fdp/update/{id}")
    public ResponseEntity<?> adminUpdateFdp(@PathVariable Long id, @RequestBody FdpProgram fdpDetails) {
        return updateFdp(id, fdpDetails);
    }

    @DeleteMapping("/admin/fdp/delete/{id}")
    public ResponseEntity<?> adminDeleteFdp(@PathVariable Long id) {
        return deleteFdp(id);
    }

    @PostMapping("/fdp/enroll/{id}")
    public ResponseEntity<?> enrollFaculty(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        Optional<User> userOpt = userRepository.findById(userId);
        Optional<FdpProgram> fdpOpt = fdpRepository.findById(id);

        if (userOpt.isEmpty() || fdpOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        FdpProgram fdp = fdpOpt.get();

        if (enrollmentRepository.findByUserIdAndFdpProgramId(userId, id).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User is already enrolled in this FDP"));
        }

        if (fdp.getMaxSeats() != null && fdp.getEnrolledCount() >= fdp.getMaxSeats()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No seats available"));
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setFdpProgram(fdp);

        fdp.setEnrolledCount(fdp.getEnrolledCount() + 1);
        fdpRepository.save(fdp);

        Enrollment saved = enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(Map.of("message", "Successfully enrolled in " + fdp.getTitle(), "enrollment", saved));
    }

    @GetMapping("/fdp/{id}/enrolled-faculty")
    public ResponseEntity<?> getEnrolledFaculty(@PathVariable Long id) {
        var enrollments = enrollmentRepository.findByFdpProgramId(id);
        var facultyList = enrollments.stream().map(e -> {
            Map<String, Object> faculty = new HashMap<>();
            faculty.put("id", e.getUser().getId());
            faculty.put("name", e.getUser().getName());
            faculty.put("email", e.getUser().getEmail());
            faculty.put("department", e.getUser().getDepartment());
            faculty.put("progress", e.getProgressPercentage());
            faculty.put("quizScore", e.getQuizScore());
            faculty.put("status", e.getStatus());
            faculty.put("enrolledAt", e.getEnrolledAt());
            return faculty;
        }).toList();
        return ResponseEntity.ok(facultyList);
    }

    /**
     * AI-powered FULL content generation for an existing FDP.
     * Generates modules, quizzes, assignments and saves them to the database.
     */
    @PostMapping("/fdp/{id}/generate-content")
    public ResponseEntity<?> generateContentViaAI(@PathVariable Long id) {
        Optional<FdpProgram> fdpOpt = fdpRepository.findById(id);
        if (fdpOpt.isEmpty()) return ResponseEntity.notFound().build();

        FdpProgram fdp = fdpOpt.get();

        try {
            // Use generateFullContent which returns modules + quizzes + assignments
            Map<String, Object> content = aiService.generateFullContent(
                    fdp.getTitle(), fdp.getCategory(), fdp.getDifficultyLevel(), fdp.getDuration());

            // Check if AI service returned an error
            if (content.containsKey("error")) {
                return ResponseEntity.status(503).body(content);
            }

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

            // Save generated modules
            if (content.containsKey("modules")) {
                fdp.setModules(mapper.writeValueAsString(content.get("modules")));
            }

            // Save generated quizzes
            if (content.containsKey("quizzes")) {
                Map<String, Object> quizData = new HashMap<>();
                quizData.put("topic", fdp.getTitle());
                quizData.put("passingScore", content.getOrDefault("passingScore", 70));
                quizData.put("questions", content.get("quizzes"));
                fdp.setQuiz(mapper.writeValueAsString(quizData));
            }

            // Save generated assignments
            if (content.containsKey("assignments")) {
                fdp.setAssignment(mapper.writeValueAsString(content.get("assignments")));
            }

            // Save learning outcomes
            if (content.containsKey("learningOutcomes")) {
                Object outcomes = content.get("learningOutcomes");
                if (outcomes instanceof java.util.List) {
                    fdp.setLearningOutcomes(String.join(", ", (java.util.List<String>) outcomes));
                } else if (outcomes instanceof String) {
                    fdp.setLearningOutcomes((String) outcomes);
                }
            }

            // Save description if empty
            if ((fdp.getDescription() == null || fdp.getDescription().isBlank()) && content.containsKey("description")) {
                fdp.setDescription((String) content.get("description"));
            }

            // Save recommended resources
            if (content.containsKey("recommendedResources")) {
                Object res = content.get("recommendedResources");
                if (res instanceof String) {
                    fdp.setRecommendedResources((String) res);
                } else {
                    fdp.setRecommendedResources(mapper.writeValueAsString(res));
                }
            }

            // Save completion criteria
            if (content.containsKey("completionCriteria")) {
                fdp.setCompletionCriteria((String) content.get("completionCriteria"));
            }

            fdpRepository.save(fdp);

            Map<String, Object> response = new HashMap<>(content);
            response.put("message", "AI successfully generated complete content for: " + fdp.getTitle());
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Content generation failed: " + e.getMessage());
            error.put("success", false);
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * AI-powered video suggestions based on module topic.
     */
    @GetMapping("/admin/fdp/suggest-video")
    public ResponseEntity<?> suggestVideo(@RequestParam String topic) {
        try {
            Map<String, Object> result = aiService.suggestVideo(topic);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to suggest video: " + e.getMessage());
            error.put("success", false);
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * AI-powered module notes generation based on module topic and FDP title.
     */
    @PostMapping("/admin/fdp/generate-module-notes")
    public ResponseEntity<?> generateModuleNotes(@RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            String fdpTitle = request.get("fdpTitle");
            if (title == null || title.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Module title is required"));
            }
            String notes = aiService.generateModuleNotes(title, fdpTitle);
            Map<String, Object> response = new HashMap<>();
            response.put("notes", notes);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to generate notes: " + e.getMessage());
            error.put("success", false);
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * AI-powered quiz generation for an FDP.
     */
    @PostMapping("/fdp/{id}/generate-quiz")
    public ResponseEntity<?> generateQuizViaAI(@PathVariable Long id,
                                                @RequestParam(defaultValue = "5") int count) {
        Optional<FdpProgram> fdpOpt = fdpRepository.findById(id);
        if (fdpOpt.isEmpty()) return ResponseEntity.notFound().build();

        FdpProgram fdp = fdpOpt.get();
        Map<String, Object> quiz = aiService.generateContextualQuiz(fdp, count);

        // Store quiz in FDP
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            fdp.setQuiz(mapper.writeValueAsString(quiz));
            fdpRepository.save(fdp);

            Long collegeId = fdp.getCollege() != null ? fdp.getCollege().getId() : null;
            notificationService.createNotification(
                "Quiz Available",
                "Quiz unlocked/available for FDP: " + fdp.getTitle(),
                "QUIZ",
                "FACULTY",
                null,
                collegeId
            );
        } catch (Exception e) {
            // Log but don't fail
        }

        Map<String, Object> response = new HashMap<>(quiz);
        response.put("message", "AI successfully generated quiz for: " + fdp.getTitle());
        return ResponseEntity.ok(response);
    }

    private void triggerUpdateNotifications(String oldModulesJson, String oldQuizJson, FdpProgram newFdp) {
        Long collegeId = newFdp.getCollege() != null ? newFdp.getCollege().getId() : null;
        int oldModCount = getModuleCount(oldModulesJson);
        int newModCount = getModuleCount(newFdp.getModules());
        if (newModCount > oldModCount) {
            notificationService.createNotification(
                "New Module Added",
                "New module added to " + newFdp.getTitle(),
                "SYSTEM",
                "FACULTY",
                null,
                collegeId
            );
        }

        boolean oldHasVideo = hasVideo(oldModulesJson);
        boolean newHasVideo = hasVideo(newFdp.getModules());
        if (newHasVideo && !oldHasVideo) {
            notificationService.createNotification(
                "New Learning Video Uploaded",
                "New video lecture added to " + newFdp.getTitle(),
                "SYSTEM",
                "FACULTY",
                null,
                collegeId
            );
        }

        boolean oldHasQuiz = oldQuizJson != null && !oldQuizJson.isBlank();
        boolean newHasQuiz = newFdp.getQuiz() != null && !newFdp.getQuiz().isBlank();
        if (newHasQuiz && !oldHasQuiz) {
            notificationService.createNotification(
                "Quiz Available",
                "Quiz unlocked/available for FDP: " + newFdp.getTitle(),
                "QUIZ",
                "FACULTY",
                null,
                collegeId
            );
        }
    }

    private int getModuleCount(String modulesJson) {
        if (modulesJson == null || modulesJson.isBlank()) return 0;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<?> list = mapper.readValue(modulesJson, List.class);
            return list.size();
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean hasVideo(String modulesJson) {
        if (modulesJson == null || modulesJson.isBlank()) return false;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<Map<String, Object>> list = mapper.readValue(modulesJson, List.class);
            for (Map<String, Object> mod : list) {
                if (mod.get("videoUrl") != null && !mod.get("videoUrl").toString().isBlank()) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
