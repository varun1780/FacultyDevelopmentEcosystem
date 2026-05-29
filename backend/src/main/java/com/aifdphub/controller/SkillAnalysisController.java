package com.aifdphub.controller;

import com.aifdphub.service.SkillAnalysisService;
import com.aifdphub.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST endpoints for real, database-driven skill gap analysis and recommendations.
 * Replaces the old /api/ai/skill-gap static fallback with live data.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SkillAnalysisController {

    private final SkillAnalysisService skillAnalysisService;
    private final NotificationService notificationService;

    public SkillAnalysisController(SkillAnalysisService skillAnalysisService, NotificationService notificationService) {
        this.skillAnalysisService = skillAnalysisService;
        this.notificationService = notificationService;
    }

    /**
     * GET /api/skill-analysis?userId={id}
     * Returns personalized skill gap analysis computed from real enrollment,
     * quiz performance, and FDP completion data.
     */
    @GetMapping("/skill-analysis")
    public ResponseEntity<?> getSkillAnalysis(@RequestParam Long userId) {
        Map<String, Object> analysis = skillAnalysisService.analyzeForUser(userId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * GET /api/recommendations?userId={id}
     * Returns personalized FDP recommendations based on identified skill gaps.
     */
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(@RequestParam Long userId) {
        Map<String, Object> recommendations = skillAnalysisService.recommendForUser(userId);
        
        notificationService.createNotification(
            "AI Recommendation Generated",
            "New AI recommended courses available for your skill profile",
            "RECOMMENDATION",
            "FACULTY",
            userId
        );

        return ResponseEntity.ok(recommendations);
    }
}
