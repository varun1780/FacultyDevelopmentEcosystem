package com.aifdphub.service;

import com.aifdphub.model.Enrollment;
import com.aifdphub.model.FdpProgram;
import com.aifdphub.repository.EnrollmentRepository;
import com.aifdphub.repository.FdpRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes real, database-driven skill gap analysis for faculty users.
 * Derives current skill levels from assessment scores, FDP completion rates,
 * and learning history rather than returning hardcoded demo data.
 */
@Service
public class SkillAnalysisService {

    private final EnrollmentRepository enrollmentRepository;
    private final FdpRepository fdpRepository;

    public SkillAnalysisService(EnrollmentRepository enrollmentRepository,
                                FdpRepository fdpRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.fdpRepository = fdpRepository;
    }

    /**
     * Build a full skill-gap analysis from real enrollment and quiz data.
     */
    public Map<String, Object> analyzeForUser(Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        List<FdpProgram> allPrograms = fdpRepository.findAll();

        Map<String, Object> result = new LinkedHashMap<>();

        // -------- 1. Group enrollments by FDP category --------
        // category -> list of quiz scores for that category
        Map<String, List<Double>> categoryScores = new LinkedHashMap<>();
        // category -> list of progress percentages
        Map<String, List<Integer>> categoryProgress = new LinkedHashMap<>();
        // track which categories the user is enrolled in
        Set<String> enrolledCategories = new LinkedHashSet<>();
        // track completed FDPs
        List<String> completedFdps = new ArrayList<>();

        for (Enrollment e : enrollments) {
            FdpProgram fdp = e.getFdpProgram();
            if (fdp == null) continue;

            String category = normalizeCategory(fdp.getCategory());
            enrolledCategories.add(category);

            categoryScores.computeIfAbsent(category, k -> new ArrayList<>());
            categoryProgress.computeIfAbsent(category, k -> new ArrayList<>());

            if (e.getQuizScore() != null && e.getQuizAttempts() != null && e.getQuizAttempts() > 0) {
                categoryScores.get(category).add(e.getQuizScore());
            }
            if (e.getProgressPercentage() != null) {
                categoryProgress.get(category).add(e.getProgressPercentage());
            }
            if (Boolean.TRUE.equals(e.getIsCompleted())) {
                completedFdps.add(fdp.getTitle());
            }
        }

        // -------- 2. Determine all relevant skill categories --------
        // Include categories from available FDPs the user has NOT enrolled in yet
        Set<String> allCategories = new LinkedHashSet<>(enrolledCategories);
        for (FdpProgram p : allPrograms) {
            allCategories.add(normalizeCategory(p.getCategory()));
        }

        // -------- 3. Calculate current & target skill levels --------
        List<Map<String, Object>> gaps = new ArrayList<>();

        for (String category : allCategories) {
            int currentLevel;
            int targetLevel;
            String priority;

            List<Double> scores = categoryScores.getOrDefault(category, Collections.emptyList());
            List<Integer> progresses = categoryProgress.getOrDefault(category, Collections.emptyList());

            if (scores.isEmpty() && progresses.isEmpty()) {
                // User has NO exposure to this category — maximum gap
                currentLevel = 0;
                targetLevel = 75;
                priority = "High";
            } else {
                // Current level = weighted combination of avg quiz score (70%) + avg progress (30%)
                double avgScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                double avgProgress = progresses.stream().mapToInt(Integer::intValue).average().orElse(0);
                currentLevel = (int) Math.round(avgScore * 0.7 + avgProgress * 0.3);
                currentLevel = Math.min(currentLevel, 100);

                // Target = always push toward mastery, but at least 20 points above current
                targetLevel = Math.min(100, Math.max(currentLevel + 20, 75));

                // Priority based on how large the gap is
                int gap = targetLevel - currentLevel;
                if (gap >= 40) priority = "High";
                else if (gap >= 20) priority = "Medium";
                else priority = "Low";
            }

            Map<String, Object> gapEntry = new LinkedHashMap<>();
            gapEntry.put("skill", category);
            gapEntry.put("currentLevel", currentLevel);
            gapEntry.put("targetLevel", targetLevel);
            gapEntry.put("gapPercentage", targetLevel - currentLevel);
            gapEntry.put("priority", priority);
            gaps.add(gapEntry);
        }

        // Sort: High priority first, then by gap size descending
        gaps.sort((a, b) -> {
            int pa = priorityOrdinal((String) a.get("priority"));
            int pb = priorityOrdinal((String) b.get("priority"));
            if (pa != pb) return pa - pb;
            return (int) b.get("gapPercentage") - (int) a.get("gapPercentage");
        });

        // -------- 4. Build analysis summary --------
        long totalEnrollments = enrollments.size();
        long totalCompleted = completedFdps.size();
        long totalAttempted = enrollments.stream().filter(e -> e.getQuizAttempts() != null && e.getQuizAttempts() > 0).count();
        double overallAvgScore = enrollments.stream()
                .filter(e -> e.getQuizScore() != null && e.getQuizAttempts() != null && e.getQuizAttempts() > 0)
                .mapToDouble(Enrollment::getQuizScore)
                .average().orElse(0);

        String analysis;
        if (totalEnrollments == 0) {
            analysis = "You haven't enrolled in any Faculty Development Programs yet. "
                    + "Enroll in available FDPs to begin building your skill profile. "
                    + "The system will track your progress and generate personalized insights as you complete assessments.";
        } else if (overallAvgScore >= 80) {
            analysis = String.format(
                    "Excellent progress! You've enrolled in %d FDP(s) and completed %d. "
                  + "Your average assessment score of %.0f%% demonstrates strong mastery. "
                  + "Focus on the remaining skill gaps below to achieve well-rounded expertise.",
                    totalEnrollments, totalCompleted, overallAvgScore);
        } else if (overallAvgScore >= 60) {
            analysis = String.format(
                    "Good progress across %d FDP enrollment(s) with %d completed. "
                  + "Your average score of %.0f%% meets the passing criteria, "
                  + "but there's room for improvement in the areas highlighted below.",
                    totalEnrollments, totalCompleted, overallAvgScore);
        } else if (totalAttempted > 0) {
            analysis = String.format(
                    "You've started %d FDP(s) but your average assessment score of %.0f%% "
                  + "indicates significant skill gaps. Review the priority areas below "
                  + "and consider retaking assessments after further study.",
                    totalEnrollments, overallAvgScore);
        } else {
            analysis = String.format(
                    "You're enrolled in %d FDP(s) but haven't attempted any assessments yet. "
                  + "Complete the quizzes to unlock your personalized skill analysis.",
                    totalEnrollments);
        }

        result.put("analysis", analysis);
        result.put("gaps", gaps);
        result.put("stats", Map.of(
                "totalEnrollments", totalEnrollments,
                "completedFdps", totalCompleted,
                "assessmentsAttempted", totalAttempted,
                "averageScore", Math.round(overallAvgScore * 10.0) / 10.0
        ));
        result.put("completedFdpTitles", completedFdps);

        return result;
    }

    /**
     * Generate personalized FDP recommendations based on real performance data.
     */
    public Map<String, Object> recommendForUser(Long userId) {
        Map<String, Object> analysisResult = analyzeForUser(userId);
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        List<FdpProgram> allPrograms = fdpRepository.findAll();

        // Build set of already-enrolled FDP IDs
        Set<Long> enrolledFdpIds = enrollments.stream()
                .filter(e -> e.getFdpProgram() != null)
                .map(e -> e.getFdpProgram().getId())
                .collect(Collectors.toSet());

        // Extract weak categories (high priority gaps)
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> gaps = (List<Map<String, Object>>) analysisResult.get("gaps");

        Set<String> weakCategories = new LinkedHashSet<>();
        for (Map<String, Object> g : gaps) {
            String priority = (String) g.get("priority");
            if ("High".equals(priority) || "Medium".equals(priority)) {
                weakCategories.add((String) g.get("skill"));
            }
        }

        // -------- Build recommendations --------
        List<Map<String, Object>> recommendations = new ArrayList<>();

        // 1. Recommend unenrolled FDPs in weak categories
        for (FdpProgram fdp : allPrograms) {
            if (enrolledFdpIds.contains(fdp.getId())) continue;

            String cat = normalizeCategory(fdp.getCategory());
            if (weakCategories.contains(cat)) {
                Map<String, Object> rec = new LinkedHashMap<>();
                rec.put("fdpId", fdp.getId());
                rec.put("title", fdp.getTitle());
                rec.put("category", fdp.getCategory());
                rec.put("difficulty", fdp.getDifficultyLevel());
                rec.put("reason", "Your " + cat + " skill level needs improvement based on assessment performance");
                rec.put("priority", "High");
                recommendations.add(rec);
            }
        }

        // 2. Recommend unenrolled FDPs in categories the user hasn't explored
        for (FdpProgram fdp : allPrograms) {
            if (enrolledFdpIds.contains(fdp.getId())) continue;

            String cat = normalizeCategory(fdp.getCategory());
            if (!weakCategories.contains(cat)) {
                // Check if the user has any enrollment in this category
                boolean hasCategory = enrollments.stream()
                        .anyMatch(e -> e.getFdpProgram() != null &&
                                normalizeCategory(e.getFdpProgram().getCategory()).equals(cat));
                if (!hasCategory) {
                    Map<String, Object> rec = new LinkedHashMap<>();
                    rec.put("fdpId", fdp.getId());
                    rec.put("title", fdp.getTitle());
                    rec.put("category", fdp.getCategory());
                    rec.put("difficulty", fdp.getDifficultyLevel());
                    rec.put("reason", "Expand your skills into " + cat + " — you haven't explored this area yet");
                    rec.put("priority", "Medium");
                    recommendations.add(rec);
                }
            }
        }

        // 3. Suggest retakes for failed/low-scoring assessments
        for (Enrollment e : enrollments) {
            if (e.getQuizAttempts() != null && e.getQuizAttempts() > 0
                    && e.getQuizScore() != null && e.getQuizScore() < 60) {
                Map<String, Object> rec = new LinkedHashMap<>();
                rec.put("fdpId", e.getFdpProgram().getId());
                rec.put("title", e.getFdpProgram().getTitle() + " (Retake Assessment)");
                rec.put("category", e.getFdpProgram().getCategory());
                rec.put("difficulty", e.getFdpProgram().getDifficultyLevel());
                rec.put("reason", String.format("You scored %.0f%% — retake the assessment to improve your %s skills",
                        e.getQuizScore(), normalizeCategory(e.getFdpProgram().getCategory())));
                rec.put("priority", "High");
                recommendations.add(rec);
            }
        }

        // Sort: High priority first
        recommendations.sort((a, b) -> priorityOrdinal((String) a.get("priority")) - priorityOrdinal((String) b.get("priority")));

        // Also flatten recommended FDP titles for backward compat
        List<String> recommendedFdpTitles = recommendations.stream()
                .map(r -> (String) r.get("title"))
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("recommendations", recommendations);
        result.put("recommendedFdps", recommendedFdpTitles);
        return result;
    }

    // ===== Helpers =====

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) return "General";
        String c = category.trim();
        // Normalize common variants — order matters: check specific terms before ambiguous ones
        String lower = c.toLowerCase();
        // Blockchain must be checked BEFORE AI (since "blockchain" contains the substring "ai")
        if (lower.contains("blockchain") || lower.contains("web3")) {
            return "Blockchain";
        }
        if (lower.contains("artificial intelligence") || lower.contains("machine learning")
                || lower.equals("ai") || lower.startsWith("ai ") || lower.endsWith(" ai") || lower.contains(" ai ")
                || lower.equals("ml") || lower.startsWith("ml ") || lower.endsWith(" ml") || lower.contains(" ml ")) {
            return "Artificial Intelligence";
        }
        if (lower.contains("data science") || lower.contains("data analytics") || lower.contains("big data")) {
            return "Data Science";
        }
        if (lower.contains("cyber") || lower.contains("security")) {
            return "Cybersecurity";
        }
        if (lower.contains("pedagogy") || lower.contains("teaching") || lower.contains("education")) {
            return "Pedagogy";
        }
        if (lower.contains("research")) {
            return "Research";
        }
        return c; // keep as-is for any other category
    }

    private int priorityOrdinal(String priority) {
        return switch (priority) {
            case "High" -> 0;
            case "Medium" -> 1;
            case "Low" -> 2;
            default -> 3;
        };
    }
}
